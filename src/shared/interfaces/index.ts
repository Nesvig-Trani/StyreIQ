export type AppPageProps<
  TParams extends Record<string, string> = {},
  TSearchParams extends Record<string, string | string[] | undefined> = {},
> = {
  params: Promise<TParams>
  searchParams?: Promise<TSearchParams>
}
