import Stats from "./stats";

export default interface StatsResult {
  stats: Stats | null
  error: string | null
}