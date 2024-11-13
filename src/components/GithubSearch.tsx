"use client";
import { useState, useEffect } from "react";
import { GithubRepository, GithubSearchResponse } from "@/@types/types";
import { SearchParams } from "next/dist/server/request/search-params";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Pagination } from "@/components/Pagination";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { api } from "@/libs/axios";
export function GithubSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState<SearchParams["sort"]>(
    (searchParams.get("sort") as SearchParams["sort"]) || "stars"
  );
  const [order, setOrder] = useState<SearchParams["order"]>(
    (searchParams.get("order") as SearchParams["order"]) || "desc"
  );
  const [perPage, setPerPage] = useState(
    Number(searchParams.get("per_page")) || 10
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );

  const [repositories, setRepositories] = useState<GithubRepository[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (searchQuery) params.set("q", searchQuery);
    else params.delete("q");

    if (sort) params.set("sort", sort as string);
    else params.delete("sort");

    if (order) params.set("order", order as string);
    else params.delete("order");

    if (perPage !== 10) params.set("per_page", String(perPage));
    else params.delete("per_page");

    if (currentPage > 1) params.set("page", String(currentPage));
    else params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  }, [
    debouncedSearch,
    sort,
    order,
    perPage,
    currentPage,
    pathname,
    router,
    searchParams,
    searchQuery
  ]);

  // Fetch repositories
  useEffect(() => {
    const fetchRepositories = async () => {
      if (!debouncedSearch) {
        setRepositories([]);
        setTotalCount(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params: SearchParams = {
          q: debouncedSearch,
          sort,
          order,
          per_page: String(perPage),
          page: String(currentPage)
        };

        const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const { data } = await api.get<GithubSearchResponse>(
          "/github/repositories",
          {
            params,
            headers
          }
        );

        setRepositories(data.items);
        setTotalCount(data.total_count);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositories();
  }, [debouncedSearch, sort, order, perPage, currentPage]);

  const handleStarRepository = async (repo: GithubRepository) => {
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    if (!token) {
      setError("Please login to star repositories");
      return;
    }

    try {
      if (repo.isStarred) {
        await api.delete(
          `/github/repositories/${repo.owner.login}/${repo.name}/star`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        await api.put(
          `/github/repositories/${repo.owner.login}/${repo.name}/star`,
          null,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }

      setRepositories((repos) =>
        repos.map((r) =>
          r.id === repo.id ? { ...r, isStarred: !r.isStarred } : r
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update star status"
      );
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as SearchParams["sort"])}
          >
            <option value="stars">Stars</option>
            <option value="forks">Forks</option>
            <option value="updated">Updated</option>
          </Select>
          <Select
            value={order}
            onChange={(e) => setOrder(e.target.value as SearchParams["order"])}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </Select>
          <Select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </Select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded">{error}</div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {/* Results */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repositories.map((repo) => (
            <Card key={repo.id} className="p-4">
              <a href={repo.html_url} target="_blank" rel="noreferrer">
                <h3 className="text-lg font-semibold">{repo.name}</h3>
              </a>
              <p className="text-sm text-gray-600 mt-2">{repo.description}</p>
              <div className="flex items-center justify-between mt-4">
                <div className="space-x-4">
                  <span>⭐ {repo.stargazers_count}</span>
                  <span>🔄 {repo.forks_count}</span>
                </div>
                <Button
                  onClick={() => handleStarRepository(repo)}
                  variant={repo.isStarred ? "secondary" : "default"}
                >
                  {repo.isStarred ? "Unstar" : "Star"}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalCount}
            pageSize={perPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </main>
  );
}
