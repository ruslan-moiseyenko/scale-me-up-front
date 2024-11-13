export interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  description: string;
  html_url: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  language: string;
  isStarred: boolean;
}

export interface GithubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GithubRepository[];
}

export interface SearchParams {
  q: string;
  sort?: "stars" | "forks" | "updated";
  order?: "asc" | "desc";
  per_page?: number;
  page?: number;
}
