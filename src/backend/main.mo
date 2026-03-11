import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Time "mo:core/Time";

actor {
  // Include blob storage for avatar images
  include MixinStorage();

  // Include authentication system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Core Types
  public type UserId = Principal;
  public type GroupId = Text;
  public type MessageId = Nat;

  public type UserProfile = {
    displayName : Text;
    avatarId : ?Text;
    lastActive : Time.Time;
  };

  public type Message = {
    id : MessageId;
    sender : UserId;
    timestamp : Int;
    content : Text;
    reactions : [Reaction];
  };

  public type Reaction = {
    userId : UserId;
    emoji : Text;
  };

  public type Group = {
    id : GroupId;
    name : Text;
    members : [UserId];
    messages : [Message];
  };

  // Storage
  let userProfiles = Map.empty<UserId, UserProfile>();
  let groups = Map.empty<GroupId, Group>();
  var nextMessageId = 0;

  // Helper function to check membership
  func isMember(members : [UserId], userId : UserId) : Bool {
    for (member in members.values()) {
      if (member == userId) { return true };
    };
    false;
  };

  // User Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(
      caller,
      {
        displayName = profile.displayName;
        avatarId = profile.avatarId;
        lastActive = Time.now();
      },
    );
  };

  public query ({ caller }) func getUserProfile(user : UserId) : async ?UserProfile {
    userProfiles.get(user);
  };

  // Group Management
  public shared ({ caller }) func createGroup(name : Text) : async GroupId {
    let groupId = name;
    let newGroup = {
      id = groupId;
      name;
      members = [caller];
      messages = [];
    };
    groups.add(groupId, newGroup);
    groupId;
  };

  public shared ({ caller }) func joinGroup(groupId : GroupId) : async () {
    let group = switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group does not exist") };
      case (?g) { g };
    };

    if (isMember(group.members, caller)) {
      return; // Already a member, no-op
    };

    let newMembers = group.members.concat([caller]);
    let updatedGroup = {
      id = group.id;
      name = group.name;
      members = newMembers;
      messages = group.messages;
    };
    groups.add(groupId, updatedGroup);
  };

  public shared ({ caller }) func inviteToGroup(groupId : GroupId, userId : UserId) : async () {
    let group = switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group does not exist") };
      case (?g) { g };
    };

    if (not isMember(group.members, caller)) {
      Runtime.trap("Only group members can invite others");
    };

    let newMembers = group.members.concat([userId]);
    let updatedGroup = {
      id = group.id;
      name = group.name;
      members = newMembers;
      messages = group.messages;
    };
    groups.add(groupId, updatedGroup);
  };

  public shared ({ caller }) func leaveGroup(groupId : GroupId) : async () {
    let group = switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group does not exist") };
      case (?g) { g };
    };

    if (not isMember(group.members, caller)) {
      Runtime.trap("You are not a member of this group");
    };

    let leftMembers = group.members.filter(func(member) { member != caller });
    let updatedGroup = {
      id = group.id;
      name = group.name;
      members = leftMembers;
      messages = group.messages;
    };
    groups.add(groupId, updatedGroup);
  };

  public query ({ caller }) func getUserGroups() : async [Group] {
    let allGroups = groups.values().toArray();
    allGroups.filter(func(group) { isMember(group.members, caller) });
  };

  // Returns all groups so any user can discover and join them
  public query ({ caller }) func getAllGroups() : async [Group] {
    groups.values().toArray();
  };

  // Messaging
  public shared ({ caller }) func sendMessage(groupId : GroupId, content : Text) : async Message {
    let group = switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group does not exist") };
      case (?g) { g };
    };

    if (not isMember(group.members, caller)) {
      Runtime.trap("You are not a member of this group");
    };

    let newMessage = {
      id = nextMessageId;
      sender = caller;
      timestamp = Time.now();
      content;
      reactions = [];
    };
    nextMessageId += 1;

    let updatedMessages = [newMessage].concat(group.messages);
    let updatedGroup = {
      id = group.id;
      name = group.name;
      members = group.members;
      messages = updatedMessages;
    };
    groups.add(groupId, updatedGroup);
    newMessage;
  };

  public shared ({ caller }) func addReaction(groupId : GroupId, messageId : MessageId, emoji : Text) : async () {
    let group = switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group does not exist") };
      case (?g) { g };
    };

    if (not isMember(group.members, caller)) {
      Runtime.trap("You are not a member of this group");
    };

    let updatedMessages = group.messages.map(func(message) {
      if (message.id == messageId) {
        let newReaction = {
          userId = caller;
          emoji;
        };
        let existingReactions = message.reactions.filter(
          func(reaction) {
            reaction.userId != caller or reaction.emoji != emoji;
          }
        );
        {
          id = message.id;
          sender = message.sender;
          timestamp = message.timestamp;
          content = message.content;
          reactions = existingReactions.concat([newReaction]);
        };
      } else {
        message;
      };
    });

    let updatedGroup = {
      id = group.id;
      name = group.name;
      members = group.members;
      messages = updatedMessages;
    };
    groups.add(groupId, updatedGroup);
  };

  public query ({ caller }) func getMessageHistory(groupId : GroupId, start : Nat) : async [Message] {
    let group = switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group does not exist") };
      case (?g) { g };
    };

    if (not isMember(group.members, caller)) {
      Runtime.trap("You are not a member of this group");
    };

    let messages = group.messages;
    let end = start + 50;
    if (start >= messages.size()) { return [] };
    if (end > messages.size()) { return messages.sliceToArray(start, messages.size()) };
    messages.sliceToArray(start, end);
  };

  // Helper Queries
  public query ({ caller }) func isGroupMember(groupId : GroupId) : async Bool {
    switch (groups.get(groupId)) {
      case (null) { false };
      case (?group) { isMember(group.members, caller) };
    };
  };

  public query ({ caller }) func getGroupMembers(groupId : GroupId) : async [UserId] {
    let group = switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group does not exist") };
      case (?g) { g };
    };

    if (not isMember(group.members, caller)) {
      Runtime.trap("You are not a member of this group");
    };

    group.members;
  };

  public query ({ caller }) func getGroupList() : async [Group] {
    let allGroups = groups.values().toArray();
    allGroups.filter(func(group) { isMember(group.members, caller) });
  };

  public query ({ caller }) func getLastActive(user : UserId) : async Time.Time {
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?profile) { profile.lastActive };
    };
  };
};
