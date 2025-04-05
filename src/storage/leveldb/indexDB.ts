import { Uint } from "low-level";
import { LevelBasedStorage } from "./levelBasedStorage";

export abstract class IndexDB<K extends LevelK, V, LevelK extends Uint = Uint, LevelV extends Uint = Uint> extends LevelBasedStorage<K, V, LevelK, LevelV> {

}
