import PersonalBest from "./personal-best";

export default interface Stats {
  [time: string]: PersonalBest[]
}