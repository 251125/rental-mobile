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

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) =>
      api
        .post<Listing>("/listings", data, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
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

export function useListingAvailability(id: string) {
  return useQuery({
    queryKey: ["listing", id, "availability"],
    queryFn: () =>
      api
        .get<ListingAvailability[]>(`/listings/${id}/availability`)
        .then((r) => r.data),
    enabled: !!id,
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
