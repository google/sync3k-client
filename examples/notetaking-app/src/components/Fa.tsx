import * as React from 'react';

export default function Fa({ fa, onClick }: { fa: string, onClick: React.MouseEventHandler<{}>}) {
  return <i className={`fa ${fa}`} aria-hidden="true" onClick={onClick} />;
}
