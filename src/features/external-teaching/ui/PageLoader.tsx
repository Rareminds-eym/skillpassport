export default function PageLoader({message}:{message:string}){
  return <div role="status" aria-live="polite" className="flex items-center gap-3 p-6"><span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"/>{message}</div>;
}
