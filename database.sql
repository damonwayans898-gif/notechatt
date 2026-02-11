-- 1. Tabela de Perfis (Extende a tabela auth.users do Supabase)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT DEFAULT 'Novo membro do NoteChat! ✨',
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Postagens
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  image TEXT,
  likes INTEGER DEFAULT 0,
  reactions JSONB DEFAULT '{}'::JSONB,
  shares INTEGER DEFAULT 0,
  is_news BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Comentários
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Grupos (Comunidades)
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT DEFAULT 'https://picsum.photos/seed/group/200',
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  members TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Mensagens de Grupo (Chat)
CREATE TABLE group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  reply_to JSONB, -- Armazena metadados da mensagem respondida
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Habilitar Row Level Security (RLS) para Segurança
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- 7. Definição de Políticas (Quem pode ver/editar o quê)

-- Perfis: Todos podem ver perfis, mas apenas o dono pode editar o seu
CREATE POLICY "Perfis públicos são visíveis por todos." ON profiles FOR SELECT USING (true);
CREATE POLICY "Usuários podem inserir seu próprio perfil." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar seu próprio perfil." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: Todos podem ver, apenas logados podem criar
CREATE POLICY "Posts são visíveis por todos." ON posts FOR SELECT USING (true);
CREATE POLICY "Usuários logados podem criar posts." ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem editar/excluir seus próprios posts." ON posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar likes de posts." ON posts FOR UPDATE USING (auth.role() = 'authenticated');

-- Comentários: Todos podem ver, apenas logados podem comentar
CREATE POLICY "Comentários são visíveis por todos." ON comments FOR SELECT USING (true);
CREATE POLICY "Usuários logados podem comentar." ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grupos: Visíveis por todos, criados por logados
CREATE POLICY "Grupos são visíveis por todos." ON groups FOR SELECT USING (true);
CREATE POLICY "Usuários logados podem criar grupos." ON groups FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Mensagens de Chat: Visíveis por todos, apenas logados podem enviar
CREATE POLICY "Mensagens são visíveis por todos." ON group_messages FOR SELECT USING (true);
CREATE POLICY "Usuários logados podem enviar mensagens." ON group_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Função de Automação: Criar perfil automaticamente no cadastro (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    'https://picsum.photos/seed/' || new.id || '/200'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();