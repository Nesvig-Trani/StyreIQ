export type AppPageProps<
  TParams extends Record<string, string> = {},
  TSearchParams extends Record<string, string | string[] | undefined> = {},
> = {
  params: TParams
  searchParams?: Promise<TSearchParams>
}
