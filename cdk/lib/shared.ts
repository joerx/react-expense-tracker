export interface GitHubRepoProps {
  readonly branch: string;
  readonly name: string;
  readonly owner: string;
  readonly oauthToken?: string;
}
