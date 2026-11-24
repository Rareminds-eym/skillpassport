/** Readable plain-text math for compact assessment previews; never changes stored answers. */
export function formatAssessmentText(value: string | null | undefined): string {
  if (!value) return '';
  const symbols: Record<string,string> = {times:'×',cdot:'·',div:'÷',leq:'≤',geq:'≥',neq:'≠',approx:'≈',pi:'π',rho:'ρ',mu:'μ',nu:'ν',Delta:'Δ',theta:'θ',alpha:'α',beta:'β'};
  const math = (expression: string) => expression
    .replace(/\\+(?:left|right)\b/g,'')
    .replace(/\\+(?:text|mathrm|mathbf)\{([^{}]*)\}/g,'$1')
    .replace(/\\+(\w+)\b/g,(match,name:string)=>symbols[name] ?? match)
    .replace(/\^(?:\{([23])\}|([23])(?!\d))/g,(_,braced:string,plain:string)=>(braced||plain)==='2'?'²':'³')
    .replace(/\\+[,; ]/g,' ').replace(/\\+!/g,'')
    .trim();
  return value
    .replace(/\\+\(([\s\S]*?)\\+\)/g,(_,expression:string)=>math(expression))
    .replace(/\\+\[([\s\S]*?)\\+\]/g,(_,expression:string)=>math(expression));
}
