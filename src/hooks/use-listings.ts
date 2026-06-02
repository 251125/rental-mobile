import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Listing, PaginatedResponse, ListingFilters } from "@/types";

export function useListings(filters: ListingFilters = {}) {
  return useQuery({
    queryKey: ["listings", filters],
    queryFn: () =>
      api
        .get<PaginatedResponse<Listing>>("/listings", {
          params: {
            ...filters,
            category_ids: filters.category_ids?.join(","),
          },
        })
        .then((r) => r.data),
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: () => api.get<Listing>(`/listings/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export interface CreateListingPayload {
  title: string;
  description: string;
  price: string | number;
  deposit: string | number;
  city: string;
  category_id: string;
  image_urls: string[];
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListingPayload) =>
      api.post<Listing>("/listings", data).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (uri: string) => {
      const filename = uri.split("/").pop()?.split("?")[0] ?? "photo.jpg";
      const formData = new FormData();

      if (uri.startsWith("blob:") || uri.startsWith("http")) {
        // Web: fetch the actual Blob from the blob/http URI
        const res = await fetch(uri);
        const blob = await res.blob();
        formData.append("file", blob, filename);
      } else {
        // React Native: use the RN-specific object shorthand
        formData.append("file", { uri, name: filename, type: "image/jpeg" } as unknown as Blob);
      }

      return api
        .post<{ url: string }>("/uploads/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data.url);
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      api
        .patch<Listing>(`/listings/${id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
      void queryClient.invalidateQueries({ queryKey: ["listing", id] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/listings/${id}`).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useSetListingVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      api
        .patch(`/listings/${id}/visibility`, { hidden })
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useMyListings() {
  return useQuery({
    queryKey: ["listings", "my"],
    queryFn: () =>
      api.get<PaginatedResponse<Listing>>("/listings/my").then((r) => r.data),
  });
}

export function useSimilarListings(id: string, categoryId: string) {
  return useQuery({
    queryKey: ["listings", "similar", id],
    queryFn: () =>
      api
        .get<Listing[]>(`/listings/${id}/similar?category_id=${categoryId}`)
        .then((r) => r.data),
    enabled: !!id && !!categoryId,
  });
}

export interface ListingAvailability {
  start_date: string;
  end_date: string;
}

export interface BlockedDate {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}

export interface ListingAvailabilityResponse {
  requests: ListingAvailability[];
  blocked: BlockedDate[];
}

export function useListingAvailability(id: string) {
  return useQuery({
    queryKey: ["listing", id, "availability"],
    queryFn: () =>
      api
        .get<ListingAvailabilityResponse>(`/listings/${id}/availability`)
        .then((r) => r.data),
    enabled: !!id,
  });
}

export function useBlockDates(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { start_date: string; end_date: string; reason?: string }) =>
      api
        .post<BlockedDate>(`/listings/${listingId}/blocked-dates`, data)
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["listing", listingId, "availability"] });
    },
  });
}

export function useUnblockDates(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) =>
      api.delete(`/listings/${listingId}/blocked-dates/${blockId}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["listing", listingId, "availability"] });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api
        .get<{ id: string; name: string }[]>("/categories")
        .then((r) => r.data),
  });
}
