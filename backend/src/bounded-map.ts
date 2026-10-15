/** Preserve source ordering while limiting in-flight database work per request. */
export async function boundedMap<T,R>(items:T[],work:(item:T)=>Promise<R>,limit=8):Promise<R[]>{
 const result:R[]=[];for(let start=0;start<items.length;start+=limit)result.push(...await Promise.all(items.slice(start,start+limit).map(work)));return result;
}
