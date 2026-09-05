import { CONFIG } from "./config.js";

function safeParse(value){
  try { return JSON.parse(value); } catch { return null; }
}

export class LocalStorageAdapter {
  constructor(storage = window.localStorage){ this.storage = storage; }

  load(){
    const current = safeParse(this.storage.getItem(CONFIG.storageKey));
    if(current) return { source:"current", data:current };

    for(const key of CONFIG.legacyKeys){
      const legacy = safeParse(this.storage.getItem(key));
      if(legacy) return { source:key, data:legacy };
    }
    return { source:"empty", data:null };
  }

  save(state){
    this.storage.setItem(CONFIG.storageKey, JSON.stringify(state));
  }

  clear(){
    [CONFIG.storageKey, ...CONFIG.legacyKeys].forEach(k => this.storage.removeItem(k));
  }

  export(state){
    return new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
  }
}
