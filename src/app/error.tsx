"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="error-page"><h1>Não foi possível carregar os dados</h1><p>Verifique a conexão e a configuração do banco de dados.</p><button className="button primary" onClick={reset}>Tentar novamente</button></div>; }
