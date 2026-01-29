const COMIC_CONFIG = {
  page1: {
    title: "El Viaje de Yunara - Inicio",
    panels: [
      {
        id: 1,
        duration: 30,
        background: "assets/panels/bg1.jpg",
        character: "assets/panels/char1.png",
        dialogue: "Mi nombre es Yunara de la Orden Kinkou.",
        sfx: null
      },
      {
        id: 2,
        duration: 25,
        background: "assets/panels/bg2.jpg",
        character: "assets/panels/char2.png",
        dialogue: "He recorrido el mundo para llegar a Demacia.",
        sfx: null
      },
      {
        id: 3,
        duration: 35,
        background: "assets/panels/bg3.jpg",
        character: "assets/panels/char3.png",
        dialogue: "Para honrar a un héroe.",
        sfx: "wind"
      },
      {
        id: 4,
        duration: 30,
        background: "assets/panels/bg4.jpg",
        character: "assets/panels/char4.png",
        dialogue: "Al reino que tanto amó.",
        sfx: null
      },
      {
        id: 5,
        duration: 40,
        background: "assets/panels/bg5.jpg",
        character: "assets/panels/char5.png",
        dialogue: "He dejado atrás mi mundo de espías.",
        sfx: null
      },
      {
        id: 6,
        duration: 30,
        background: "assets/panels/bg6.jpg",
        character: "assets/panels/char6.png",
        dialogue: "Para entrar al suyo.",
        sfx: null
      }
    ]
  },

  page2: {
    title: "El Viaje de Yunara - Demacia",
    panels: [
      {
        id: 1,
        duration: 45,
        background: "assets/panels/bg7.jpg",
        character: "assets/panels/char7.png",
        dialogue: "Había oído sobre la piedra líquida.",
        lottie: "lottie/frame.lottie",
        size: "wide"
      },
      {
        id: 2,
        duration: 30,
        background: "assets/panels/bg8.jpg",
        character: "assets/panels/char8.png",
        dialogue: "Tersa como el agua pero dura como el acero.",
        sfx: "crystal"
      },
      {
        id: 3,
        duration: 35,
        background: "assets/panels/bg9.jpg",
        character: "assets/panels/char9.png",
        dialogue: "Solo así existiría una ciudad tan inmensa.",
        sfx: null
      },
      {
        id: 4,
        duration: 40,
        background: "assets/panels/bg10.jpg",
        character: "assets/panels/char10.png",
        dialogue: "Es maravillosa, pero extraña.",
        lottie: "lottie/frame2.lottie",
        size: "tall"
      }
    ]
  },

  page3: {
    title: "El Viaje de Yunara - Encuentro",
    mainPanel: {
      background: "assets/panels/bg-main.jpg",
      character: "assets/panels/char-main.png",
      duration: 60
    },
    popup: {
      delay: 2000,
      duration: 6000,
      dialogues: [
        "Las tierras originarias nunca están quietas.",
        "El aire siempre danza."
      ]
    },
    hotspots: [
      {
        id: "detail1",
        position: { top: "30%", left: "20%" },
        lottie: "lottie/frame.lottie",
        detailImage: "assets/panels/detail1.jpg",
        dialogue: "Mi príncipe, el rey lo espera.",
        sfx: "dialogue1"
      },
      {
        id: "detail2",
        position: { top: "60%", right: "25%" },
        lottie: "lottie/frame2.lottie",
        detailImage: "assets/panels/detail2.jpg",
        dialogue: "Pero aquí... hasta la rosa parece reposar en silencio.",
        sfx: "dialogue2"
      }
    ]
  },

  audio: {
    soundtrack: "assets/audio/banda-sonora.mp3",
    ambient: "assets/audio/ambiente.mp3",
    effects: "assets/audio/efectos.mp3",
    dialogues: "assets/audio/dialogos.mp3",
    defaultVolumes: {
      master: 100,
      soundtrack: 75,
      ambient: 75,
      effects: 75,
      dialogues: 75
    }
  },

  effects: {
    parallaxIntensity: {
      background: 1.1,
      character: 1.05
    },
    transitionSpeed: 0.5,
    autoPlayOnLoad: false,
    keyboardControls: true
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = COMIC_CONFIG;
}
