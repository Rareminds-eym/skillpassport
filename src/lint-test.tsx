import React, { useEffect } from 'react';

// Intentional errors for testing linting

// 1. Using 'var' (Airbnb forbids this, prefers const/let)
const badVariable = 'I should be const';

// 2. Using 'any' type (TypeScript strict mode forbids this)
const explicitAny: any = 'I am any';

// 3. Bad formatting (Prettier should fix this)
const uglyFormat = {
  name: 'test',
  val: 1,
};

// 4. Unused variable (ESLint 'no-unused-vars')
const unusedVar = 'I am not used';

export const LintTestComponent = () => {
  // 5. Missing dependency in useEffect (react-hooks)
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    console.log(count);
  }, []); // count is missing from dependencies

  return <div>{badVariable}</div>;
};
