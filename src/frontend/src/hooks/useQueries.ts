import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Group, GroupId, Message, UserProfile } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetUserGroups() {
  const { actor, isFetching } = useActor();

  return useQuery<Group[]>({
    queryKey: ["userGroups"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserGroups();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useGetMessageHistory(groupId: GroupId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ["messages", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      return actor.getMessageHistory(groupId, 0n);
    },
    enabled: !!actor && !isFetching && !!groupId,
    refetchInterval: 3000,
  });
}

export function useSendMessage(groupId: GroupId | null) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor || !groupId) throw new Error("Not ready");
      return actor.sendMessage(groupId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", groupId] });
      queryClient.invalidateQueries({ queryKey: ["userGroups"] });
    },
  });
}

export function useAddReaction(groupId: GroupId | null) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: { messageId: bigint; emoji: string }) => {
      if (!actor || !groupId) throw new Error("Not ready");
      return actor.addReaction(groupId, messageId, emoji);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", groupId] });
    },
  });
}

export function useCreateGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createGroup(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userGroups"] });
    },
  });
}

export function useGetGroupMembers(groupId: GroupId | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      return actor.getGroupMembers(groupId);
    },
    enabled: !!actor && !isFetching && !!groupId,
  });
}

export function useInviteToGroup(groupId: GroupId | null) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor || !groupId) throw new Error("Not ready");
      const principal = Principal.fromText(userId);
      return actor.inviteToGroup(groupId, principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMembers", groupId] });
      queryClient.invalidateQueries({ queryKey: ["userGroups"] });
    },
  });
}

export function useLeaveGroup(groupId: GroupId | null) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor || !groupId) throw new Error("Not ready");
      return actor.leaveGroup(groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userGroups"] });
    },
  });
}

export function useGetUserProfile(userId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      try {
        const principal = Principal.fromText(userId);
        return actor.getUserProfile(principal);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!userId,
    staleTime: 30_000,
  });
}

export function useCurrentIdentity() {
  const { identity } = useInternetIdentity();
  return identity?.getPrincipal().toString() ?? null;
}
