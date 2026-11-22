-- Libera as tabelas para o site (API do Supabase).
-- Projetos novos do Supabase não fazem isso automaticamente.
-- QUEM vê O QUÊ continua sendo decidido pelas regras de segurança (RLS) do schema.sql:
-- este arquivo só abre a porta; as regras decidem quem passa.

grant usage on schema public to anon, authenticated;

-- Vitrine pública: visitantes podem ver produtos e planos.
grant select on public.produtos, public.planos, public.planos_produtos to anon;

-- Usuários logados: acesso às tabelas, sempre filtrado pelas regras de segurança.
grant select, insert, update, delete on
  public.clientes, public.mapas_nascimento, public.produtos, public.planos,
  public.planos_produtos, public.assinaturas, public.compras
to authenticated;

-- Funções usadas pelas regras de segurança e pelo site.
grant execute on function public.meu_cliente_id() to anon, authenticated;
grant execute on function public.meu_papel()      to anon, authenticated;
grant execute on function public.sou_admin()      to anon, authenticated;
grant execute on function public.meus_produtos()  to authenticated;
grant execute on function public.cliente_tem_acesso(uuid, text) to authenticated;
