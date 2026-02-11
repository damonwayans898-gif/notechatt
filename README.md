
# 🚀 Implantando o NoteChat na Vercel

Siga este guia para colocar seu NoteChat online em menos de 5 minutos.

## 1. Variáveis de Ambiente (Obrigatório)
No painel da Vercel, vá em **Settings > Environment Variables** e adicione:

| Chave | Valor |
| :--- | :--- |
| `API_KEY` | Sua chave do Google Gemini |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave Anon do Supabase |

## 2. Configurações de Build
Como este projeto usa **ESM nativo** (sem compiladores pesados), as configurações padrão da Vercel para "Static HTML" funcionarão.
- **Framework Preset:** Other (ou None)
- **Output Directory:** `.` (diretório raiz)

## 3. Ajuste no Supabase (Autenticação)
Para que o login funcione no seu site novo:
1. Vá em [Supabase Dashboard](https://supabase.com/dashboard).
2. Acesse **Authentication > URL Configuration**.
3. Em **Site URL**, coloque o link que a Vercel te deu (ex: `https://meu-app.vercel.app`).
4. Em **Redirect URLs**, adicione o mesmo link.

## 4. Banco de Dados
Certifique-se de ter executado o conteúdo de `database.sql` no **SQL Editor** do Supabase para criar as tabelas de perfis, posts e chats.

---
Desenvolvido com tecnologia Gemini 2.5 e Supabase.
