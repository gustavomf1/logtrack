# LogTrack

Rastreamento de lotes via RFID para a logística e o almoxarifado CTMAQ. Aplicação Next.js, TypeScript, Tailwind, NextAuth e Prisma, com modo local de demonstração e schema PostgreSQL para Supabase.

## Executar no computador

Requisitos: Node.js 20.9 ou superior e npm.

```powershell
npm install
Copy-Item .env.example .env
```

Se `.env` já existir, preserve-o. Preencha `SUPERVISOR_EMAIL`, `SUPERVISOR_PASSWORD` (mínimo 10 caracteres) e `NEXTAUTH_SECRET` (segredo aleatório de pelo menos 32 caracteres). Para gerar um segredo:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Mantenha `DEMO_MODE=true` e `NEXTAUTH_URL=http://localhost:3000` para uso local.

```powershell
npm run db:seed
npm run dev
```

Abra [o painel local](http://localhost:3000). Entre com o e-mail e a senha definidos no `.env`. O modo local salva os dados em `data/demo.json`, com senha em bcrypt. Nenhum PostgreSQL é necessário para a demonstração. Alterar a senha no `.env` depois do primeiro seed não altera o usuário já salvo.

O seed cria um supervisor, três zonas (Recebimento, Almoxarifado e Expedição), três celulares e cinco lotes. Ele preserva os dados locais existentes; no PostgreSQL, recusa bancos já preenchidos.

## Ativar os três celulares

Depois de executar `npm run db:seed`, abra [os links individuais de ativação](data/README-ativacoes.md). Esse arquivo é gerado com os tokens reais e fica fora do controle de versão. Também há uma cópia estruturada em `data/ativacoes.json`.

1. Abra a URL do Celular 1 no aparelho da Zona A — Recebimento.
2. Abra a URL do Celular 2 no aparelho da Zona B — Almoxarifado.
3. Abra a URL do Celular 3 no aparelho da Zona C — Expedição.

No celular, `localhost` aponta para o próprio aparelho. Para operação RFID física, use a URL HTTPS da aplicação publicada e configure `NEXTAUTH_URL` com essa mesma origem antes de gerar os links. Após a ativação, salve `/estacao` como atalho na tela inicial.

Novas estações são cadastradas em **Estações → Cadastrar celular**. O link de ativação aparece após salvar. **Regenerar token** invalida os cookies antigos imediatamente; abra o novo link no aparelho. A zona de uma estação é fixa. Para mudar a área, desative a estação e cadastre outra.

## Fluxo de uso

- **Lotes → Novo lote:** preencha o código, a descrição, a quantidade e a validade. O lote começa Sem Zona.
- **Gravar etiqueta:** no celular do supervisor, grave a URL em uma etiqueta RFID e cole-a no lote. A confirmação só é salva após a gravação terminar com sucesso.
- **Leitura na estação:** aproxime a etiqueta do celular ativado. A página registra automaticamente a movimentação e mostra o resultado.
- **Consulta e auditoria:** use o painel para filtrar lotes, editar cadastros, acompanhar zonas e consultar o histórico completo.

| Estado do lote | Leitura | Resultado |
| --- | --- | --- |
| Sem Zona | Qualquer estação ativa | Vai para a zona dessa estação |
| Em uma zona | Mesmo celular da última movimentação | Cancela e volta para Sem Zona |
| Em uma zona | Outro celular | Vai para a zona do outro celular |
| Qualquer estado | Sem cookie válido ou estação desativada | Consulta, sem movimentação |

Uma nova abertura ou atualização da página `/l/:id` é uma nova leitura. Prefetch e requisições GET não movimentam: o navegador envia automaticamente um POST depois de abrir a página. Repetições da mesma tentativa de rede usam o mesmo identificador, evitando movimentos duplicados. JavaScript e conexão com o servidor são necessários; aguarde a confirmação antes de repetir a leitura.

A página pública mostra cinco movimentos; o painel mantém todo o histórico. Para excluir um lote, use a lixeira na lista ou **Excluir lote** nos detalhes e confirme. Ele sai do estoque e não pode mais ser editado ou movimentado, mesmo se estava em uma zona; seu histórico e a última localização ficam preservados para consulta. O código do lote continua reservado. Zonas só podem ser desativadas sem lotes ativos associados e sem estações ativas. Eventos de auditoria não são apagados.

## RFID

A gravação das etiquetas RFID usa a API Web NFC do navegador (`NDEFReader.write`) com um registro URI, exige uma ação do supervisor e pode ser cancelada. Use Chrome no Android, RFID/NFC habilitado e HTTPS. A interface detecta a ausência da API e permite copiar a URL para abrir a tela de gravação em um aparelho compatível. [Documentação do Chrome sobre Web NFC](https://developer.chrome.com/docs/capabilities/nfc).

Os testes automatizados não substituem a validação com etiquetas e celulares físicos.

## Verificações

```powershell
npm run typecheck
npm test
npm run build
npm run test:e2e
```

O teste de navegador usa o Google Chrome instalado, inicia o build na porta 3100 e cria dados separados em `test-results/`. Não deve haver outro servidor nessa porta. Os testes cobrem a tabela de decisão, consultas, retries simultâneos, cancelamento, revogação de token, desativação, validação e preservação do histórico, além do fluxo de login, cadastro e leitura no navegador.

Para executar o build local:

No Windows, o `prebuild` remove o atributo de somente leitura apenas dos diretórios gerados em `.next`, evitando que a sincronização do OneDrive impeça uma nova compilação.

```powershell
npm run build
npm start
```

## Publicar com Supabase e Vercel

Esta etapa exige as contas e credenciais do responsável pelo projeto; os arquivos locais não configuram esses serviços automaticamente.

1. Crie o banco PostgreSQL no Supabase e configure `DATABASE_URL` para a conexão de execução e `DIRECT_URL` para a conexão de migrations fornecidas pelo projeto.
2. Configure `DEMO_MODE=false`, `NEXTAUTH_URL` com a URL HTTPS final, `NEXTAUTH_SECRET` e as credenciais do supervisor no ambiente de configuração inicial.
3. Execute `npm run db:migrate` e, em um banco vazio, `npm run db:seed`. Guarde `data/README-ativacoes.md` em local privado.
4. Envie o código ao repositório GitHub escolhido, sem `.env`, `data/`, `node_modules/` ou resultados de testes.
5. Importe o repositório na Vercel e configure as variáveis de runtime. O build é `npm run build`. As credenciais `SUPERVISOR_*` só são necessárias para o seed; o login usa o hash já salvo no banco.
6. Valide login, ativação, movimento e cancelamento em três aparelhos com etiquetas físicas.

As migrations incluem proteção contra alteração, exclusão e truncamento dos registros de auditoria. O cookie da estação é assinado, HttpOnly, SameSite=Lax e Secure quando a origem configurada usa HTTPS, com validade de um ano. O modo de demonstração é bloqueado na Vercel.

Esta implementação de MVP carrega o estado de operação em transações e serializa escritas PostgreSQL por advisory lock. Antes de ampliar para um estoque volumoso, substitua a leitura integral por consultas paginadas e transações por lote, mantendo a idempotência e a auditoria.
