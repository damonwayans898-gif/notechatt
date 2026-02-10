
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { PostCard } from './components/PostCard';
import { Assistant } from './components/Assistant';
import { ImageEditor } from './components/ImageEditor';
import { GroupManager } from './components/GroupManager';
import { GroupChat } from './components/GroupChat';
import { Dashboard } from './components/Dashboard';
import { supabase } from './services/supabaseClient';
import { notificationService } from './services/notificationService';
import { Post, User, Group, GroupMessage, Comment } from './types';
import { Sparkles, Image as ImageIcon, Search, Plus, X, Zap, Users as UsersIcon, Edit3, Loader2, BellRing } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeChatGroup, setActiveChatGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [isNewsPost, setIsNewsPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);

  const activeChatRef = useRef<Group | null>(null);
  useEffect(() => { activeChatRef.current = activeChatGroup; }, [activeChatGroup]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setUser(profile);
        const granted = await notificationService.requestPermission();
        setNotifEnabled(granted);
      }
      await fetchData();
      setLoading(false);
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('realtime_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' },
        async (payload) => {
          const newMessage = payload.new;
          if (newMessage.user_id === user.id) return;
          const { data: author } = await supabase.from('profiles').select('name').eq('id', newMessage.user_id).single();
          const { data: group } = await supabase.from('groups').select('name').eq('id', newMessage.group_id).single();
          const isMention = newMessage.text.includes(`@${user.name}`);
          const isCurrentGroup = activeChatRef.current?.id === newMessage.group_id;
          
          if (isCurrentGroup) {
            const msg: GroupMessage = {
              id: newMessage.id,
              userId: newMessage.user_id,
              userName: author?.name || 'Membro',
              userAvatar: `https://picsum.photos/seed/${newMessage.user_id}/200`,
              text: newMessage.text,
              timestamp: new Date(newMessage.created_at),
              replyTo: newMessage.reply_to // Mapeando metadados de resposta vindos do Supabase
            };
            setGroups(prev => prev.map(g => g.id === newMessage.group_id ? { ...g, messages: [...(g.messages || []), msg] } : g));
          }
          if (isMention || !isCurrentGroup) {
            notificationService.send(isMention ? `🔔 Você foi mencionado!` : `Mensagem em ${group?.name}`, {
              body: `${author?.name}: ${newMessage.text.substring(0, 50)}...`,
              tag: newMessage.group_id
            });
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async () => {
    const { data: postsData } = await supabase.from('posts').select('*, profiles(name, avatar)').order('created_at', { ascending: false });
    if (postsData) {
      setPosts(postsData.map(p => ({
        id: p.id,
        userId: p.user_id,
        userName: p.profiles?.name || 'Usuário',
        userAvatar: p.profiles?.avatar || '',
        content: p.content,
        image: p.image,
        timestamp: new Date(p.created_at).toLocaleString(),
        likes: p.likes || 0,
        reactions: p.reactions || {},
        shares: p.shares || 0,
        isNews: p.is_news,
        comments: []
      })));
    }
    const { data: groupsData } = await supabase.from('groups').select('*');
    if (groupsData) setGroups(groupsData);
  };

  const handleLogin = (userData: User) => { setUser(userData); fetchData(); };
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setActiveView('feed'); };

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    await supabase.from('posts').update({ likes: post.likes + 1 }).eq('id', postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  };

  const handleReact = async (postId: string, reaction: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const currentReactions = post.reactions || {};
    const newReactions = { ...currentReactions, [reaction]: (currentReactions[reaction] || 0) + 1 };
    await supabase.from('posts').update({ reactions: newReactions }).eq('id', postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, reactions: newReactions } : p));
  };

  const handleComment = async (postId: string, comment: Comment) => {
    await supabase.from('comments').insert([{ post_id: postId, user_id: user?.id, content: comment.content }]);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [comment, ...(p.comments || [])] } : p));
  };

  const handleCreatePost = async (imageUrl?: string) => {
    if (!newPostText.trim() && !imageUrl || !user) return;
    const { data } = await supabase.from('posts').insert([{ user_id: user.id, content: newPostText, image: imageUrl, is_news: isNewsPost }]).select('*, profiles(name, avatar)').single();
    if (data) {
      setPosts([{
        id: data.id, userId: user.id, userName: user.name, userAvatar: user.avatar, content: data.content,
        image: data.image, timestamp: 'Agora mesmo', likes: 0, reactions: {}, shares: 0, comments: [], isNews: data.is_news
      }, ...posts]);
    }
    setNewPostText(''); setIsNewsPost(false); setIsEditorOpen(false);
  };

  const handleSendMessage = async (groupId: string, text: string, replyTo?: { userName: string, text: string }) => {
    if (!user) return;
    // Persistindo reply_to como um campo metadados (JSONB no Supabase)
    await supabase.from('group_messages').insert([{ 
      group_id: groupId, 
      user_id: user.id, 
      text: text, 
      reply_to: replyTo 
    }]);

    const newMessage: GroupMessage = { 
      id: 'msg-' + Date.now(), 
      userId: user.id, 
      userName: user.name, 
      userAvatar: user.avatar, 
      text, 
      timestamp: new Date(),
      replyTo: replyTo
    };

    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const updated = { ...g, messages: [...(g.messages || []), newMessage] };
        if (activeChatGroup?.id === groupId) setActiveChatGroup(updated);
        return updated;
      }
      return g;
    }));
  };

  const filteredPosts = posts.filter(p =>
    p.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (searchQuery.toLowerCase() === 'notícias' && p.isNews)
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
      <p className="font-black text-black uppercase tracking-widest text-sm">Sincronizando NoteChat...</p>
    </div>
  );

  if (!user) return <Auth onLogin={handleLogin} />;

  const renderContent = () => {
    if (searchQuery) {
       return (
        <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b-2 pb-6 border-black/10">
            <div>
              <h2 className="text-3xl font-black text-black tracking-tight">Busca: <span className="text-blue-700">"{searchQuery}"</span></h2>
              <p className="text-gray-900 font-black mt-2 uppercase tracking-widest text-[11px] bg-gray-100 px-3 py-1 rounded-full border border-gray-200">Encontrados {filteredPosts.length} resultados</p>
            </div>
            <button onClick={() => setSearchQuery('')} className="p-3 bg-white border-2 border-black hover:bg-gray-100 rounded-2xl transition-all shadow-md active:scale-95"><X className="w-6 h-6 text-black" /></button>
          </div>
          <section className="space-y-8">
            {filteredPosts.map(post => <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} onReact={handleReact} currentUser={user} />)}
          </section>
        </div>
      );
    }

    if (activeChatGroup) {
      return (
        <GroupChat group={activeChatGroup} currentUser={user} onBack={() => setActiveChatGroup(null)} onSendMessage={handleSendMessage} />
      );
    }

    switch (activeView) {
      case 'groups': return (
        <GroupManager currentUser={user} groups={groups} onOpenChat={(g) => setActiveChatGroup(g)} onCreateGroup={async (g) => {
             const { data } = await supabase.from('groups').insert([{ ...g, admin_id: user.id }]).select().single();
             if (data) setGroups([data, ...groups]);
          }} onApproveRequest={() => {}} />
      );
      case 'dashboard': return <Dashboard />;
      case 'profile': return (
        <div className="w-full bg-white rounded-[3rem] border-2 border-black shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
          <div className="h-64 bg-black relative">
            <div className="absolute -bottom-24 left-10">
              <img src={user.avatar} className="w-48 h-48 rounded-[2.5rem] border-[10px] border-white shadow-2xl object-cover" />
            </div>
          </div>
          <div className="pt-28 px-12 pb-16">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-5xl font-black text-black tracking-tighter">{user.name}</h2>
               <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 ${notifEnabled ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <BellRing className={`w-4 h-4 ${notifEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Push {notifEnabled ? 'Ativo' : 'Inativo'}</span>
               </div>
            </div>
            <p className="mt-8 text-lg font-bold text-gray-700 max-w-2xl">"{user.bio || 'Sem biografia definida.'}"</p>
          </div>
        </div>
      );
      default: return (
        <div className="flex flex-col md:flex-row gap-8 w-full animate-in fade-in duration-500">
          <div className="flex-1 space-y-8 max-w-2xl mx-auto w-full">
            {isEditorOpen ? (
              <ImageEditor onClose={() => setIsEditorOpen(false)} onPost={handleCreatePost} />
            ) : (
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-2 border-black space-y-6">
                <div className="flex gap-5">
                  <img src={user.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-gray-50" />
                  <textarea
                    placeholder={`No que você está pensando agora, ${user.name.split(' ')[0]}?`}
                    className="w-full bg-gray-50 rounded-[2rem] p-6 font-bold text-lg outline-none h-36 focus:bg-white focus:border-black/20 border-2 border-transparent transition-all text-black"
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between border-t-2 border-gray-100 pt-6">
                  <button onClick={() => setIsEditorOpen(true)} className="flex items-center gap-2.5 bg-gray-100 text-black px-5 py-3 rounded-2xl font-black text-sm hover:bg-black hover:text-white transition-all">
                    <Sparkles className="w-5 h-5" /> IA Studio
                  </button>
                  <button onClick={() => handleCreatePost()} disabled={!newPostText.trim()} className="px-12 py-3.5 rounded-2xl font-black bg-black text-white disabled:opacity-30 shadow-xl active:scale-[0.98] transition-all">
                    Publicar Post
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-10">
              {filteredPosts.map(post => <PostCard key={post.id} post={post} currentUser={user} onLike={handleLike} onComment={handleComment} onReact={handleReact} />)}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <Layout user={user} onSearch={setSearchQuery} onNavigate={(v) => { setActiveView(v); setActiveChatGroup(null); }} onLogout={handleLogout} activeView={activeView}>
      {renderContent()}
      <Assistant />
    </Layout>
  );
};

export default App;
