type Listener = (...args: any[]) => void;

class _EventBus {
  private listeners = new Map<string, Set<Listener>>();
  on(e: string, fn: Listener) { if(!this.listeners.has(e)) this.listeners.set(e,new Set()); this.listeners.get(e)!.add(fn); }
  off(e: string, fn: Listener) { this.listeners.get(e)?.delete(fn); }
  emit(e: string, ...args: unknown[]) { this.listeners.get(e)?.forEach(fn=>{try{fn(...args)}catch(err){console.error('[EventBus]',e,err)}}); }
  clear() { this.listeners.clear(); }
}
export const EventBus = new _EventBus();
