# Como ligar a área de clientes (Supabase)

São cerca de 15 minutos, uma vez só.

## 1. Criar o projeto

1. Acesse <https://supabase.com> e crie uma conta (pode entrar com o GitHub).
2. **New project** → nome `entre-estrelas` → região **South America (São Paulo)**.
3. Crie uma senha forte para o banco e guarde-a no seu gerenciador de senhas. Ela não vai no site.

## 2. Criar as tabelas

1. No menu lateral, abra **SQL Editor** → **New query**.
2. Cole o conteúdo inteiro de [`schema.sql`](schema.sql) e clique em **Run**.
3. Deve aparecer "Success". Se aparecer erro, copie a mensagem e mande para o Claude.
4. Repita com [`permissoes.sql`](permissoes.sql) e depois com [`002_niveis_e_novidades.sql`](002_niveis_e_novidades.sql),
   nesta ordem (níveis de acesso, ferramentas gratuitas e consentimento para novidades).

## 3. Ligar o site ao projeto

1. Abra **Project Settings → API**.
2. Copie a **Project URL** e a chave **anon public**.
3. Cole as duas em [`js/supabase-config.js`](../js/supabase-config.js).

A chave `anon` é pública e pode ficar no site. **Nunca** coloque a chave `service_role` no site.

## 4. Configurar o login

Em **Authentication → URL Configuration**:

- **Site URL:** o endereço do site, por exemplo `https://entreestrelas.com`.
- **Redirect URLs:** adicione `https://SEU-DOMINIO/**` e, para testes no computador, `http://localhost:8000/**`.

Em **Authentication → Sign In / Providers → Email**, deixe **Email** ligado.

Em **Authentication → Email Templates → Magic Link**, traduza o e-mail. Sugestão:

```html
<h2>Seu acesso ao Entre Estrelas ★</h2>
<p>Clique no botão abaixo para entrar. O link vale por 1 hora.</p>
<p><a href="{{ .ConfirmationURL }}">Entrar no Entre Estrelas</a></p>
<p>Está em outro aparelho? Digite este código na tela de entrar:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>Se você não pediu este acesso, ignore este e-mail.</p>
```

Use o mesmo texto no modelo **Confirm signup** (primeiro acesso de quem ainda não tem conta).

### Entrar com Google (opcional)

O botão "Entrar com Google" aparece sozinho na tela de entrar assim que o Google estiver ligado:

1. Em <https://console.cloud.google.com>, crie um projeto "Entre Estrelas".
2. **APIs e serviços → Tela de consentimento OAuth**: tipo **Externo**, nome "Entre Estrelas",
   seu e-mail de suporte, e publique.
3. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**.
   Em **URIs de redirecionamento autorizados**, coloque:
   `https://tnvzvexolyrrzhoftknp.supabase.co/auth/v1/callback`
4. Copie o **ID do cliente** e a **Chave secreta**.
5. No Supabase: **Authentication → Sign In / Providers → Google** → ative e cole os dois.

## 5. Envio de e-mails de verdade (antes de divulgar)

O e-mail padrão do Supabase envia **poucos e-mails por hora** e serve só para testes.
Antes de divulgar o login para os clientes:

1. Crie uma conta no <https://resend.com> (o plano gratuito envia 3.000 e-mails por mês).
2. Confirme o seu domínio no Resend (ele mostra os registros DNS para copiar).
3. No Supabase: **Authentication → Emails → SMTP Settings** → ative **Custom SMTP** com os dados do Resend
   (host `smtp.resend.com`, porta `465`, usuário `resend`, senha = API key do Resend,
   remetente `contato@seudominio.com`).

## 6. Tornar-se administrador

1. Abra o site, vá em **Minha área** e entre com o seu e-mail (clique no link que chegar).
2. No **SQL Editor** do Supabase, rode (com o seu e-mail):

```sql
update public.clientes set papel = 'admin' where email = 'seu@email.com';
```

3. Recarregue a página: o link **Painel** aparece na sua área.

## Como funciona no dia a dia

- **Alguém comprou o Membro Fundador:** no Painel, cadastre o e-mail da pessoa com "Liberar: Membro Fundador".
  Se ela já tiver cadastro, clique em **Tornar Fundador**.
- **Alguém comprou um produto avulso:** clique em **Registrar compra**.
- **Dados de nascimento:** a pessoa preenche uma única vez ao abrir o Mapa da Vida pela primeira vez.
  Depois disso ela não consegue alterar (para que uma compra não sirva para gerar mapas de várias pessoas).
  Correções são feitas por você, no botão **Ver mapa** do Painel.
- **Produto novo:** no Supabase, **Table Editor → produtos → Insert row**. Fundadores ganham acesso automaticamente.
