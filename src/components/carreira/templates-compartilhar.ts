// Templates de mensagens para o modal "Compartilhar perfil"
// Placeholders: {nome} = nome do atleta, {link} = URL pronta

export type TemplateModo = 'torcedor' | 'atleta' | 'rede';

export interface Template {
  id: string;
  label: string;
  hint?: string;
  body: string;
}

export const TEMPLATES_TORCEDOR: Template[] = [
  {
    id: 'direto',
    label: 'Direto',
    hint: 'Curto e objetivo',
    body:
      'Aqui é o {nome}! 🙌\n' +
      'Tô montando meu perfil esportivo e queria te ter na minha torcida.\n' +
      'É rapidinho, é só clicar e me seguir:\n{link}',
  },
  {
    id: 'curto',
    label: 'Curto',
    hint: 'Pra mandar pra galera',
    body:
      'Aqui é o {nome} 👊\n' +
      'Cola na minha torcida! {link}',
  },
  {
    id: 'explicativo',
    label: 'Explicativo',
    hint: 'Pra família que não conhece',
    body:
      'Aqui é o {nome}! Tudo bem? 😊\n\n' +
      'Eu criei meu perfil esportivo numa plataforma chamada Carreira ID — é tipo um LinkedIn pra quem joga bola.\n' +
      'Lá eu mostro meus jogos, gols, troféus e a evolução da minha carreira.\n\n' +
      'Queria muito te ter como torcedor(a) acompanhando essa jornada comigo. ' +
      'É só clicar no link, fazer um cadastro rapidinho e me seguir:\n\n{link}\n\n' +
      'Vai ser muito massa ter você junto! ⚽',
  },
];

export const TEMPLATES_ATLETA_CRIANCA: Template[] = [
  {
    id: 'gamer',
    label: 'Ranking',
    hint: 'Foco em gamificação',
    body:
      'Aqui é o {nome}! 🎮⚽\n' +
      'Cara, entra nesse app comigo — tem ranking, níveis, XP por jogo, troféu, tudo!\n' +
      'Bora ver quem sobe mais rápido?\n{link}',
  },
  {
    id: 'time',
    label: 'Pro time',
    hint: 'Convite pra colegas de time',
    body:
      'Aqui é o {nome} 👊\n' +
      'Tô usando uma plataforma pra registrar tudo da nossa carreira (gol, jogo, premiação).\n' +
      'Cria o seu também, aí a gente acompanha um ao outro:\n{link}',
  },
  {
    id: 'curto',
    label: 'Curto',
    hint: 'Direto ao ponto',
    body: 'Aqui é o {nome}, cola nesse app comigo, é massa demais: {link}',
  },
];

export const TEMPLATES_ATLETA_PAI: Template[] = [
  {
    id: 'apresentacao',
    label: 'Apresentação',
    hint: 'Pra outros pais',
    body:
      'Oi! Tudo bem?\n\n' +
      'Estou usando uma plataforma chamada Carreira ID pra registrar a trajetória esportiva do meu filho — jogos, gols, troféus, evolução.\n' +
      'É bem útil pra acompanhar a carreira da molecada e mostrar pra olheiros e clubes.\n\n' +
      'Cadastra o seu também, fica fácil de a gente trocar ideia sobre a evolução deles:\n{link}',
  },
  {
    id: 'curto-pai',
    label: 'Curto',
    hint: 'Mensagem rápida',
    body:
      'Oi! Tô usando esse app pra acompanhar o esporte do meu filho — vale dar uma olhada e cadastrar o seu:\n{link}',
  },
];

export const TEMPLATES_REDE: Template[] = [
  {
    id: 'profissional',
    label: 'Profissional',
    hint: 'Formal — pra quem ainda não conhece',
    body:
      'Olá! Tudo bem?\n\n' +
      'Aqui é o(a) responsável pelo atleta {nome}. Estamos usando o Carreira ID, ' +
      'uma plataforma feita pra reunir profissionais do esporte (técnicos, professores, scouts, preparadores) ' +
      'e acompanhar a trajetória de jovens atletas.\n\n' +
      'Adoraríamos ter você na nossa rede. É só fazer um cadastro rápido escolhendo seu perfil profissional:\n\n{link}',
  },
  {
    id: 'tecnico-conhecido',
    label: 'Técnico conhecido',
    hint: 'Mais informal',
    body:
      'Fala, professor(a)! 👊\n' +
      'Aqui é o pai/mãe do {nome}. A gente tá registrando a carreira dele(a) numa plataforma nova ' +
      'e queria muito te ter conectado lá pra acompanhar a evolução de perto.\n\n' +
      'Cadastro rapidinho, escolhe seu perfil (técnico/professor/scout) e a gente já fica conectado:\n{link}',
  },
];

export function aplicarTemplate(template: string, nome: string, link: string): string {
  return template.replace(/\{nome\}/g, nome).replace(/\{link\}/g, link);
}
