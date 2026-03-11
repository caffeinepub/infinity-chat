import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Reaction {
    userId: UserId;
    emoji: string;
}
export type UserId = Principal;
export type GroupId = string;
export type Time = bigint;
export type MessageId = bigint;
export interface Message {
    id: MessageId;
    content: string;
    sender: UserId;
    timestamp: bigint;
    reactions: Array<Reaction>;
}
export interface Group {
    id: GroupId;
    members: Array<UserId>;
    messages: Array<Message>;
    name: string;
}
export interface UserProfile {
    displayName: string;
    avatarId?: string;
    lastActive: Time;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addReaction(groupId: GroupId, messageId: MessageId, emoji: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createGroup(name: string): Promise<GroupId>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGroupList(): Promise<Array<Group>>;
    getGroupMembers(groupId: GroupId): Promise<Array<UserId>>;
    getLastActive(user: UserId): Promise<Time>;
    getMessageHistory(groupId: GroupId, start: bigint): Promise<Array<Message>>;
    getUserGroups(): Promise<Array<Group>>;
    getUserProfile(user: UserId): Promise<UserProfile | null>;
    inviteToGroup(groupId: GroupId, userId: UserId): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isGroupMember(groupId: GroupId): Promise<boolean>;
    leaveGroup(groupId: GroupId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(groupId: GroupId, content: string): Promise<Message>;
}
