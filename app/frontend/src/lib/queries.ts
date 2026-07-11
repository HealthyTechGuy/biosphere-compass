import { queryOptions } from "@tanstack/react-query";
import {
  getHomeData,
  listBusinesses,
  getBusinessBySlug,
  getAnalyticsData,
  getCompassDimensions,
} from "@/lib/public.functions";

export const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: () => getHomeData(),
});

export const businessesQuery = queryOptions({
  queryKey: ["businesses"],
  queryFn: () => listBusinesses(),
});

export const businessQuery = (slug: string) =>
  queryOptions({
    queryKey: ["business", slug],
    queryFn: () => getBusinessBySlug({ data: { slug } }),
  });

export const analyticsQuery = queryOptions({
  queryKey: ["analytics"],
  queryFn: () => getAnalyticsData(),
});

export const dimensionsQuery = queryOptions({
  queryKey: ["dimensions"],
  queryFn: () => getCompassDimensions(),
});
