
import { Post, User, Group } from './types';

export const CURRENT_USER: User = {
  id: 'me',
  name: 'Desenvolvedor Senior',
  avatar: 'https://picsum.photos/seed/me/200',
  bio: 'Amante de tecnologia e IA.',
  followers: 1240,
  following: 850
};

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Ana Silva', avatar: 'https://picsum.photos/seed/ana/200', followers: 500, following: 200 },
  { id: '2', name: 'Bruno Costa', avatar: 'https://picsum.photos/seed/bruno/200', followers: 300, following: 400 },
  { id: '3', name: 'Carla Souza', avatar: 'https://picsum.photos/seed/carla/200', followers: 1200, following: 100 },
  { id: '4', name: 'Daniel Oliveira', avatar: 'https://picsum.photos/seed/daniel/200', followers: 50, following: 1500 },
  { id: 'news_bot', name: 'NoteChat News', avatar: 'https://picsum.photos/seed/news/200', followers: 10000, following: 0 },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'n1',
    userId: 'news_bot',
    userName: 'NoteChat News',
    userAvatar: 'https://picsum.photos/seed/news/200',
    content: 'URGENTE: Nova atualização do Gemini 2.5 traz capacidades de vídeo em tempo real para todos os usuários do NoteChat. Confira os detalhes na documentação oficial.',
    image: 'https://picsum.photos/seed/ai_news/800/600',
    timestamp: 'Agora mesmo',
    likes: 1250,
    shares: 450,
    isNews: true,
    comments: []
  },
  {
    id: 'p1',
    userId: '1',
    userName: 'Ana Silva',
    userAvatar: 'https://picsum.photos/seed/ana/200',
    content: 'Acabei de descobrir as novas funcionalidades do NoteChat! A IA está incrível. 🚀',
    image: 'https://picsum.photos/seed/post1/800/600',
    timestamp: 'Há 2 horas',
    likes: 42,
    shares: 5,
    comments: [
      {
        id: 'c1',
        userId: '2',
        userName: 'Bruno Costa',
        userAvatar: 'https://picsum.photos/seed/bruno/200',
        content: 'Realmente, o editor de imagem com IA é de outro mundo!',
        timestamp: 'Há 1 hora',
        likes: 12,
        replies: []
      }
    ]
  },
  {
    id: 'n2',
    userId: 'news_bot',
    userName: 'NoteChat News',
    userAvatar: 'https://picsum.photos/seed/news/200',
    content: 'ECONOMIA: Mercado de tecnologia apresenta crescimento de 15% no último trimestre com a adoção em massa de assistentes virtuais.',
    timestamp: 'Há 15 min',
    likes: 89,
    shares: 12,
    isNews: true,
    comments: []
  },
  {
    id: 'p2',
    userId: '3',
    userName: 'Carla Souza',
    userAvatar: 'https://picsum.photos/seed/carla/200',
    content: 'O pôr do sol hoje estava maravilhoso. Alguém mais viu?',
    image: 'https://picsum.photos/seed/sunset/800/600',
    timestamp: 'Há 5 horas',
    likes: 128,
    shares: 12,
    comments: []
  }
];

export const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Desenvolvedores React',
    description: 'Espaço para discutir React e Next.js',
    image: 'https://picsum.photos/seed/react/200',
    adminId: 'me',
    members: ['me', '1', '2'],
    pendingRequests: ['3', '4'],
    isPrivate: true
  },
  {
    id: 'g2',
    name: 'Fotografia Digital',
    description: 'Dicas e truques para fotos incríveis',
    image: 'https://picsum.photos/seed/photo/200',
    adminId: '1',
    members: ['1', 'me'],
    pendingRequests: [],
    isPrivate: false
  }
];
