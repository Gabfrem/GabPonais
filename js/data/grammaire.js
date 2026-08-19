/**
 * Cours de grammaire, du tout début.
 *
 * Vingt-deux points classés par ordre d'utilité : chacun s'appuie sur les
 * précédents. Les exemples n'emploient que du vocabulaire de la liste des
 * 1000 mots, pour qu'on puisse les lire sans dictionnaire.
 *
 * Format d'un exemple : [kanji, kana, romaji, français]
 */
export default [
  {
    id: 'desu',
    titre: 'です — dire ce que c’est',
    resume: 'La phrase la plus simple : « A est B ».',
    points: [
      'です se place à la toute fin de la phrase et correspond à « c’est » ou au verbe être. Il ne se conjugue pas selon la personne : la même forme sert pour je, tu, il ou nous.',
      'Sa négation polie est ではありません, souvent abrégée en じゃないです à l’oral.',
      'Le japonais n’exprime pas le sujet quand il est évident. 学生です seul veut dire « je suis étudiant » si le contexte est clair.',
    ],
    exemples: [
      ['私は学生です。', 'わたしはがくせいです。', 'watashi wa gakusei desu.', 'Je suis étudiant.'],
      ['これは本です。', 'これはほんです。', 'kore wa hon desu.', 'Ceci est un livre.'],
      ['あの人は先生ではありません。', 'あのひとはせんせいではありません。', 'ano hito wa sensei dewa arimasen.', 'Cette personne n’est pas professeur.'],
    ],
    quiz: [
      {
        enonce: 'Comment dit-on « Ce n’est pas de l’eau » ?',
        options: ['これは水です。', 'これは水ではありません。', 'これは水ますか。'],
        bonne: 1,
        explication: 'ではありません est la négation de です. La première phrase affirme au contraire que c’en est.',
      },
      {
        enonce: 'Où se place です dans la phrase ?',
        options: ['Au début', 'Juste après le sujet', 'À la fin'],
        bonne: 2,
        explication: 'Le verbe japonais est toujours en fin de phrase — c’est la différence de structure la plus importante avec le français.',
      },
    ],
  },
  {
    id: 'wa',
    titre: 'は — poser le thème',
    resume: 'Ce dont on va parler, annoncé en premier.',
    points: [
      'は se prononce « wa » quand il sert de particule, jamais « ha ». C’est la seule exception de ce genre, et elle est constante.',
      'は marque le thème : « en ce qui concerne… ». Ce n’est pas exactement le sujet grammatical français.',
      'Dans 私は魚が好きです, le thème est « moi », mais ce qui est aimé — le poisson — est marqué par が. Littéralement : « quant à moi, le poisson est aimable ».',
    ],
    exemples: [
      ['今日は暑いです。', 'きょうはあついです。', 'kyou wa atsui desu.', 'Aujourd’hui, il fait chaud.'],
      ['姉は学生です。', 'あねはがくせいです。', 'ane wa gakusei desu.', 'Ma grande sœur est étudiante.'],
      ['私は魚が好きです。', 'わたしはさかながすきです。', 'watashi wa sakana ga suki desu.', 'Moi, j’aime le poisson.'],
    ],
    quiz: [
      {
        enonce: 'Comment se prononce la particule は ?',
        options: ['ha', 'wa', 'ba'],
        bonne: 1,
        explication: 'Écrite は, prononcée « wa » — uniquement lorsqu’elle est particule. Dans un mot comme はな (fleur), elle se lit bien « ha ».',
      },
      {
        enonce: 'Que marque は ?',
        options: ['Le thème de la phrase', 'Le complément d’objet', 'Le lieu'],
        bonne: 0,
        explication: 'は annonce ce dont on parle. Le complément d’objet se marque avec を, le lieu avec で ou に.',
      },
    ],
  },
  {
    id: 'no',
    titre: 'の — relier deux noms',
    resume: 'Appartenance, origine, précision.',
    points: [
      'の relie deux noms : le premier précise le second. 私の本 = « mon livre ».',
      'L’ordre est l’inverse du français : le possesseur vient en premier, l’objet possédé ensuite. 学校の先生 = « le professeur de l’école ».',
      'の ne sert pas qu’à la possession : il exprime tout lien entre deux noms, y compris l’origine ou la matière.',
    ],
    exemples: [
      ['私の名前', 'わたしのなまえ', 'watashi no namae', 'mon nom'],
      ['学校の先生', 'がっこうのせんせい', 'gakkou no sensei', 'le professeur de l’école'],
      ['友達の家に行きます。', 'ともだちのいえにいきます。', 'tomodachi no ie ni ikimasu.', 'Je vais chez un ami.'],
    ],
    quiz: [
      {
        enonce: 'Comment dit-on « la voiture de mon ami » ?',
        options: ['車の友達', '友達の車', '友達は車'],
        bonne: 1,
        explication: 'Le possesseur d’abord : 友達 (ami) の 車 (voiture). L’ordre inverse dirait « l’ami de la voiture ».',
      },
      {
        enonce: 'Dans 日本の本, quel mot précise l’autre ?',
        options: ['日本 précise 本', '本 précise 日本', 'Aucun des deux'],
        bonne: 0,
        explication: 'Le premier nom précise toujours le second : il s’agit d’un livre japonais, pas d’un Japon de livre.',
      },
    ],
  },
  {
    id: 'kore',
    titre: 'これ・それ・あれ — désigner',
    resume: 'Trois distances, là où le français n’en a que deux.',
    points: [
      'これ désigne ce qui est près de moi, それ ce qui est près de toi, あれ ce qui est loin de nous deux. Le français ne distingue que « ceci » et « cela ».',
      'これ・それ・あれ remplacent un nom. この・その・あの se placent devant un nom : この本 = « ce livre ».',
      'La série interrogative est どれ (lequel) et どの (quel + nom).',
    ],
    exemples: [
      ['これは私の鞄です。', 'これはわたしのかばんです。', 'kore wa watashi no kaban desu.', 'Ceci est mon sac.'],
      ['その本を読みました。', 'そのほんをよみました。', 'sono hon o yomimashita.', 'J’ai lu ce livre (celui près de toi).'],
      ['あの店は安いです。', 'あのみせはやすいです。', 'ano mise wa yasui desu.', 'Ce magasin là-bas est bon marché.'],
    ],
    quiz: [
      {
        enonce: 'Tu tiens un objet en main. Comment le désignes-tu ?',
        options: ['これ', 'それ', 'あれ'],
        bonne: 0,
        explication: 'これ désigne ce qui est dans ta sphère. Si ton interlocuteur le tenait, tu dirais それ.',
      },
      {
        enonce: 'Laquelle de ces formes se place devant un nom ?',
        options: ['これ', 'この', 'どれ'],
        bonne: 1,
        explication: 'この本 est correct, これ本 ne l’est pas. これ s’emploie seul, comme un pronom.',
      },
    ],
  },
  {
    id: 'ka',
    titre: 'か — poser une question',
    resume: 'Une seule syllabe suffit.',
    points: [
      'Ajouter か à la fin d’une phrase la transforme en question. Il n’y a ni inversion ni changement d’ordre des mots.',
      'À l’écrit, le point d’interrogation est facultatif : か suffit à marquer la question.',
      'Les mots interrogatifs — 何 (quoi), 誰 (qui), どこ (où), いつ (quand) — restent à la place qu’occuperait la réponse.',
    ],
    exemples: [
      ['これは水ですか。', 'これはみずですか。', 'kore wa mizu desu ka.', 'Est-ce de l’eau ?'],
      ['駅はどこですか。', 'えきはどこですか。', 'eki wa doko desu ka.', 'Où est la gare ?'],
      ['何を食べますか。', 'なにをたべますか。', 'nani o tabemasu ka.', 'Qu’est-ce que tu manges ?'],
    ],
    quiz: [
      {
        enonce: 'Comment transformer 学生です en question ?',
        options: ['ですか学生', '学生ですか', 'か学生です'],
        bonne: 1,
        explication: 'か se place tout à la fin, après です. L’ordre des mots ne bouge pas.',
      },
      {
        enonce: 'Où se place 何 dans « Que bois-tu ? » ?',
        options: ['Au début, comme en français', 'À la place qu’occuperait la réponse', 'À la fin'],
        bonne: 1,
        explication: '何を飲みますか : 何 occupe la position du complément d’objet, exactement là où l’on répondrait 水を.',
      },
    ],
  },
  {
    id: 'mo',
    titre: 'も — aussi',
    resume: 'Remplace は ou を, ne s’y ajoute pas.',
    points: [
      'も signifie « aussi ». Il prend la place de は ou de を, on n’écrit jamais はも ni をも.',
      'Avec une négation, も prend le sens de « rien », « personne », « nulle part » : 何も分かりません = « je ne comprends rien ».',
      'Répété, il traduit « et… et… » : 水もお茶も飲みます = « je bois de l’eau et du thé ».',
    ],
    exemples: [
      ['私も学生です。', 'わたしもがくせいです。', 'watashi mo gakusei desu.', 'Moi aussi je suis étudiant.'],
      ['これも買います。', 'これもかいます。', 'kore mo kaimasu.', 'J’achète ça aussi.'],
      ['何も分かりません。', 'なにもわかりません。', 'nani mo wakarimasen.', 'Je ne comprends rien.'],
    ],
    quiz: [
      {
        enonce: 'Comment dit-on « Moi aussi j’y vais » ?',
        options: ['私はも行きます', '私も行きます', '私もは行きます'],
        bonne: 1,
        explication: 'も remplace は au lieu de s’y ajouter. Les formes はも et もは n’existent pas.',
      },
      {
        enonce: 'Que signifie 誰も来ませんでした ?',
        options: ['Tout le monde est venu', 'Personne n’est venu', 'Quelqu’un est venu'],
        bonne: 1,
        explication: 'も avec une négation donne un sens totalement négatif : 誰も + négation = « personne ».',
      },
    ],
  },
  {
    id: 'wo',
    titre: 'を — le complément d’objet',
    resume: 'Ce que l’action affecte.',
    points: [
      'を marque le complément d’objet direct : ce sur quoi porte l’action. Il se prononce « o », jamais « wo ».',
      'Ce caractère ne sert qu’à cela : dès que tu le vois, tu sais que le mot qui précède subit l’action.',
      'Avec les verbes de mouvement, を marque aussi le lieu traversé : 道を渡る = « traverser la rue ».',
    ],
    exemples: [
      ['水を飲みます。', 'みずをのみます。', 'mizu o nomimasu.', 'Je bois de l’eau.'],
      ['本を読みます。', 'ほんをよみます。', 'hon o yomimasu.', 'Je lis un livre.'],
      ['音楽を聞きます。', 'おんがくをききます。', 'ongaku o kikimasu.', 'J’écoute de la musique.'],
    ],
    quiz: [
      {
        enonce: 'Dans 手紙を書きます, quel est le rôle de 手紙 ?',
        options: ['Le sujet qui écrit', 'Ce qui est écrit', 'Le lieu où l’on écrit'],
        bonne: 1,
        explication: 'を marque l’objet de l’action : c’est la lettre qui est écrite.',
      },
      {
        enonce: 'Comment se prononce を ?',
        options: ['o', 'wo', 'no'],
        bonne: 0,
        explication: 'La graphie est を mais la prononciation moderne est « o », identique à お.',
      },
    ],
  },
  {
    id: 'masu',
    titre: 'Les verbes en -ます',
    resume: 'La forme polie, au présent et au futur.',
    points: [
      'La forme en -ます est la forme polie du verbe. Elle couvre à la fois le présent et le futur : 行きます veut dire « je vais » comme « j’irai ».',
      'La négation remplace -ます par -ません : 食べます → 食べません.',
      'Le verbe ne change pas selon la personne. 行きます peut signifier je vais, tu vas, il va ou nous allons — le contexte tranche.',
    ],
    exemples: [
      ['毎日、勉強します。', 'まいにち、べんきょうします。', 'mainichi, benkyou shimasu.', 'J’étudie tous les jours.'],
      ['お酒を飲みません。', 'おさけをのみません。', 'osake o nomimasen.', 'Je ne bois pas d’alcool.'],
      ['明日、学校に行きます。', 'あした、がっこうにいきます。', 'ashita, gakkou ni ikimasu.', 'Demain, je vais à l’école.'],
    ],
    quiz: [
      {
        enonce: 'Quelle est la négation de 見ます ?',
        options: ['見ません', '見ないます', '見ではありません'],
        bonne: 0,
        explication: '-ます devient -ません. ではありません ne s’emploie qu’avec です et les noms.',
      },
      {
        enonce: '食べます peut-il désigner le futur ?',
        options: ['Non, uniquement le présent', 'Oui, présent et futur', 'Uniquement le futur'],
        bonne: 1,
        explication: 'Le japonais n’oppose pas présent et futur mais accompli et non-accompli. Un mot comme 明日 précise le moment.',
      },
    ],
  },
  {
    id: 'mashita',
    titre: 'Le passé : -ました',
    resume: 'Un seul temps du passé, et sa négation.',
    points: [
      '-ます devient -ました au passé : 食べます → 食べました.',
      'La négation passée est -ませんでした : 食べませんでした = « je n’ai pas mangé ».',
      'Pour です, le passé est でした et sa négation ではありませんでした.',
    ],
    exemples: [
      ['昨日、映画を見ました。', 'きのう、えいがをみました。', 'kinou, eiga o mimashita.', 'Hier, j’ai vu un film.'],
      ['何も買いませんでした。', 'なにもかいませんでした。', 'nani mo kaimasen deshita.', 'Je n’ai rien acheté.'],
      ['学生でした。', 'がくせいでした。', 'gakusei deshita.', 'J’étais étudiant.'],
    ],
    quiz: [
      {
        enonce: 'Quel est le passé négatif de 行きます ?',
        options: ['行きましたない', '行きませんでした', '行かないでした'],
        bonne: 1,
        explication: 'On part de la négation 行きません, à laquelle on ajoute でした.',
      },
      {
        enonce: 'Comment dit-on « C’était intéressant » avec です ?',
        options: ['面白いです', '面白いでした', '面白かったです'],
        bonne: 2,
        explication: 'Piège : un adjectif en -い porte lui-même la marque du passé (面白かった). でした ne s’emploie qu’après un nom ou un adjectif en -な.',
      },
    ],
  },
  {
    id: 'ni',
    titre: 'に — le point visé',
    resume: 'Destination, moment précis, existence.',
    points: [
      'に marque la destination d’un déplacement : 学校に行きます = « je vais à l’école ».',
      'Il marque aussi le moment précis, quand celui-ci peut se lire sur un calendrier ou une horloge : 七時に起きます. On ne le met pas avec 今日 ni 明日.',
      'Enfin, il indique le lieu où quelque chose se trouve, avec ある et いる : ここに本があります.',
    ],
    exemples: [
      ['駅に行きます。', 'えきにいきます。', 'eki ni ikimasu.', 'Je vais à la gare.'],
      ['朝、六時に起きます。', 'あさ、ろくじにおきます。', 'asa, rokuji ni okimasu.', 'Le matin, je me lève à six heures.'],
      ['左に病院があります。', 'ひだりにびょういんがあります。', 'hidari ni byouin ga arimasu.', 'Il y a un hôpital à gauche.'],
    ],
    quiz: [
      {
        enonce: 'Faut-il に après 明日 ?',
        options: ['Oui, toujours', 'Non, jamais', 'Seulement à l’écrit'],
        bonne: 1,
        explication: 'に n’accompagne que les repères temporels chiffrés. 明日, 今日 et 昨日 s’emploient nus.',
      },
      {
        enonce: 'Quelle phrase indique une destination ?',
        options: ['学校で勉強します', '学校に行きます', '学校の先生'],
        bonne: 1,
        explication: 'に marque vers où l’on va. で marquerait le lieu où se déroule l’action.',
      },
    ],
  },
  {
    id: 'de',
    titre: 'で — le cadre de l’action',
    resume: 'Là où ça se passe, et par quel moyen.',
    points: [
      'で marque le lieu où se déroule l’action : 公園で遊びます = « je joue au parc ».',
      'Il marque aussi le moyen ou l’instrument : 電車で行きます = « j’y vais en train », 日本語で話す = « parler en japonais ».',
      'La différence avec に est nette : に indique un point visé, で un cadre dans lequel quelque chose se déroule.',
    ],
    exemples: [
      ['公園で遊びます。', 'こうえんであそびます。', 'kouen de asobimasu.', 'Je joue au parc.'],
      ['電車で会社に行きます。', 'でんしゃでかいしゃにいきます。', 'densha de kaisha ni ikimasu.', 'Je vais au bureau en train.'],
      ['現金で払います。', 'げんきんではらいます。', 'genkin de haraimasu.', 'Je paie en espèces.'],
    ],
    quiz: [
      {
        enonce: 'Quelle particule pour « J’étudie à la bibliothèque » ?',
        options: ['図書館に勉強します', '図書館で勉強します', '図書館を勉強します'],
        bonne: 1,
        explication: 'Étudier est une action qui se déroule dans un lieu : で. に indiquerait qu’on se rend à la bibliothèque.',
      },
      {
        enonce: 'Que signifie バスで行きます ?',
        options: ['J’y vais en bus', 'Je vais au bus', 'Je descends du bus'],
        bonne: 0,
        explication: 'で marque ici le moyen de transport.',
      },
    ],
  },
  {
    id: 'ga',
    titre: 'が, et sa différence avec は',
    resume: 'Le point le plus délicat du japonais élémentaire.',
    points: [
      'が marque le sujet grammatical. Il est obligatoire avec ある et いる, et avec les adjectifs de goût ou de capacité : 水がある, 魚が好きです.',
      'La différence avec は tient à l’information : は reprend quelque chose de déjà connu, が introduit du neuf ou désigne précisément qui.',
      '誰が来ましたか demande « qui est venu ? » et la réponse emploiera が. Avec は, la question porterait sur quelqu’un dont on parlait déjà.',
      'Une règle pratique : dans une question en 何 ou 誰, la réponse garde la particule が.',
    ],
    exemples: [
      ['時間がありません。', 'じかんがありません。', 'jikan ga arimasen.', 'Je n’ai pas le temps.'],
      ['私は猫が好きです。', 'わたしはねこがすきです。', 'watashi wa neko ga suki desu.', 'Moi, j’aime les chats.'],
      ['誰が来ましたか。', 'だれがきましたか。', 'dare ga kimashita ka.', 'Qui est venu ?'],
    ],
    quiz: [
      {
        enonce: 'Quelle particule après 水 dans « Il y a de l’eau » ?',
        options: ['水はあります', '水があります', '水をあります'],
        bonne: 1,
        explication: 'ある et いる réclament が. 水は serait possible mais changerait le sens : « quant à l’eau, il y en a ».',
      },
      {
        enonce: 'Dans 私は魚が好きです, que marque が ?',
        options: ['Celui qui aime', 'Ce qui est aimé', 'Le lieu'],
        bonne: 1,
        explication: '好き fonctionne comme un adjectif : littéralement « quant à moi, le poisson est plaisant ». が marque donc le poisson.',
      },
    ],
  },
  {
    id: 'to',
    titre: 'と et や — énumérer',
    resume: 'Liste complète ou liste ouverte.',
    points: [
      'と relie des noms de façon exhaustive : パンと卵 = « du pain et des œufs », rien d’autre.',
      'や donne une liste d’exemples, sous-entendant « entre autres » : パンや卵 = « du pain, des œufs, et cetera ».',
      'と signifie aussi « avec » : 友達と行きます = « j’y vais avec un ami ».',
      'Attention : と ne relie jamais deux phrases ni deux adjectifs, seulement des noms.',
    ],
    exemples: [
      ['卵と牛乳を買います。', 'たまごとぎゅうにゅうをかいます。', 'tamago to gyuunyuu o kaimasu.', 'J’achète des œufs et du lait.'],
      ['家族と話します。', 'かぞくとはなします。', 'kazoku to hanashimasu.', 'Je parle avec ma famille.'],
      ['野菜や果物が好きです。', 'やさいやくだものがすきです。', 'yasai ya kudamono ga suki desu.', 'J’aime les légumes, les fruits, ce genre de choses.'],
    ],
    quiz: [
      {
        enonce: 'Tu veux dire que tu as acheté exactement deux choses. Quelle particule ?',
        options: ['と', 'や', 'も'],
        bonne: 0,
        explication: 'と donne une liste close. や laisserait entendre qu’il y en avait d’autres.',
      },
      {
        enonce: 'Que signifie 友達と映画を見ました ?',
        options: ['J’ai vu un ami et un film', 'J’ai vu un film avec un ami', 'Mon ami a vu un film'],
        bonne: 1,
        explication: 'Ici と marque l’accompagnement, sens très courant avec les verbes d’action.',
      },
    ],
  },
  {
    id: 'aru',
    titre: 'ある et いる — il y a',
    resume: 'Deux verbes selon que ça bouge ou non.',
    points: [
      'ある s’emploie pour les choses inanimées, いる pour les êtres vivants qui se déplacent — personnes et animaux.',
      'Les plantes prennent ある : elles ne se déplacent pas. Une voiture prend ある, même en mouvement, mais son conducteur いる.',
      'La construction est « lieu に + chose が + ある/いる ».',
      'ある sert aussi à dire « avoir » : 時間があります = « j’ai le temps ».',
    ],
    exemples: [
      ['机の上に本があります。', 'つくえのうえにほんがあります。', 'tsukue no ue ni hon ga arimasu.', 'Il y a un livre sur le bureau.'],
      ['公園に子供がいます。', 'こうえんにこどもがいます。', 'kouen ni kodomo ga imasu.', 'Il y a un enfant dans le parc.'],
      ['お金がありません。', 'おかねがありません。', 'okane ga arimasen.', 'Je n’ai pas d’argent.'],
    ],
    quiz: [
      {
        enonce: 'Quel verbe pour « Il y a un chat » ?',
        options: ['猫があります', '猫がいます', '猫がします'],
        bonne: 1,
        explication: 'Un chat est un être animé : いる. ある le traiterait comme un objet.',
      },
      {
        enonce: 'Et pour « Il y a une voiture » ?',
        options: ['車があります', '車がいます', 'Les deux se disent'],
        bonne: 0,
        explication: 'Une voiture reste un objet : ある, même lorsqu’elle roule.',
      },
    ],
  },
  {
    id: 'adj-i',
    titre: 'Les adjectifs en -い',
    resume: 'Ils se conjuguent comme des verbes.',
    points: [
      'Ces adjectifs se terminent par い : 高い, 安い, 面白い. Ils se placent directement devant le nom : 高い車.',
      'Leur négation remplace le い final par くない : 高い → 高くない.',
      'Ils n’ont pas besoin de です pour former une phrase, mais on l’ajoute par politesse : 高いです.',
      'Attention à 綺麗 et 嫌い : ils finissent par い mais sont des adjectifs en -な. Ce sont les deux pièges classiques.',
    ],
    exemples: [
      ['この車は高いです。', 'このくるまはたかいです。', 'kono kuruma wa takai desu.', 'Cette voiture est chère.'],
      ['この本は面白くないです。', 'このほんはおもしろくないです。', 'kono hon wa omoshirokunai desu.', 'Ce livre n’est pas intéressant.'],
      ['新しい鞄を買いました。', 'あたらしいかばんをかいました。', 'atarashii kaban o kaimashita.', 'J’ai acheté un sac neuf.'],
    ],
    quiz: [
      {
        enonce: 'Quelle est la négation de 安い ?',
        options: ['安いではありません', '安くない', '安いない'],
        bonne: 1,
        explication: 'Le い final devient くない. ではありません ne s’emploie qu’après un nom ou un adjectif en -な.',
      },
      {
        enonce: '綺麗 est un adjectif de quel type ?',
        options: ['En -い, il finit par い', 'En -な, malgré son い'],
        bonne: 1,
        explication: 'Le い de 綺麗 appartient au mot lui-même, pas à la terminaison. On dit 綺麗な部屋 et 綺麗ではありません.',
      },
    ],
  },
  {
    id: 'adj-na',
    titre: 'Les adjectifs en -な',
    resume: 'Ils se comportent comme des noms.',
    points: [
      'Ces adjectifs prennent な devant un nom : 静かな部屋 = « une chambre calme ».',
      'En fin de phrase, ils perdent le な et prennent です : この部屋は静かです.',
      'Leur négation suit celle des noms : 静かではありません.',
      'Beaucoup d’adjectifs empruntés au chinois appartiennent à cette catégorie : 便利, 有名, 大切, 元気.',
    ],
    exemples: [
      ['静かな部屋です。', 'しずかなへやです。', 'shizuka na heya desu.', 'C’est une chambre calme.'],
      ['この店は有名です。', 'このみせはゆうめいです。', 'kono mise wa yuumei desu.', 'Ce magasin est connu.'],
      ['便利ではありません。', 'べんりではありません。', 'benri dewa arimasen.', 'Ce n’est pas pratique.'],
    ],
    quiz: [
      {
        enonce: 'Comment dit-on « une personne gentille » avec 親切 ?',
        options: ['親切人', '親切な人', '親切の人'],
        bonne: 1,
        explication: 'Un adjectif en -な réclame な devant le nom. の relierait deux noms, ce qui n’est pas le cas ici.',
      },
      {
        enonce: 'Quelle est la négation de 元気です ?',
        options: ['元気くないです', '元気ではありません', '元気ません'],
        bonne: 1,
        explication: 'Les adjectifs en -な se nient comme les noms, avec ではありません.',
      },
    ],
  },
  {
    id: 'adj-passe',
    titre: 'Le passé des adjectifs',
    resume: 'Là où les deux familles se séparent nettement.',
    points: [
      'Un adjectif en -い porte lui-même le passé : 高い → 高かった. On ne dit jamais 高いでした.',
      'Sa négation passée est -くなかった : 高くなかった = « ce n’était pas cher ».',
      'Un adjectif en -な suit le nom : 静かでした, 静かではありませんでした.',
      'いい est irrégulier : son passé est よかった, jamais いかった.',
    ],
    exemples: [
      ['映画は面白かったです。', 'えいがはおもしろかったです。', 'eiga wa omoshirokatta desu.', 'Le film était intéressant.'],
      ['天気は良くなかったです。', 'てんきはよくなかったです。', 'tenki wa yokunakatta desu.', 'Le temps n’était pas bon.'],
      ['部屋は静かでした。', 'へやはしずかでした。', 'heya wa shizuka deshita.', 'La chambre était calme.'],
    ],
    quiz: [
      {
        enonce: 'Quel est le passé de 楽しい ?',
        options: ['楽しいでした', '楽しかった', '楽しでした'],
        bonne: 1,
        explication: 'Le い devient かった. La forme 楽しいでした est une faute très répandue chez les débutants.',
      },
      {
        enonce: 'Quel est le passé de いい ?',
        options: ['いかった', 'よかった', 'いいでした'],
        bonne: 1,
        explication: 'いい se conjugue sur son ancienne forme よい : よかった, よくない, よくなかった.',
      },
    ],
  },
  {
    id: 'te',
    titre: 'La forme en -て',
    resume: 'La clé qui ouvre la moitié de la grammaire.',
    points: [
      'La forme en -て ne porte ni temps ni politesse : elle sert de point d’accroche à quantité de constructions.',
      'Seule, elle enchaîne les actions : 起きて、ご飯を食べて、行きます = « je me lève, je mange, puis je pars ».',
      'Sa formation dépend de la terminaison du verbe. Les plus fréquentes : る → って, む/ぶ/ぬ → んで, く → いて, ぐ → いで, す → して.',
      'Deux irréguliers à retenir : する → して et 来る → 来て. Et 行く fait 行って, pas 行いて.',
    ],
    exemples: [
      ['ドアを開けてください。', 'ドアをあけてください。', 'doa o akete kudasai.', 'Ouvrez la porte, s’il vous plaît.'],
      ['ここに座ってもいいですか。', 'ここにすわってもいいですか。', 'koko ni suwatte mo ii desu ka.', 'Je peux m’asseoir ici ?'],
      ['ゆっくり話してください。', 'ゆっくりはなしてください。', 'yukkuri hanashite kudasai.', 'Parlez lentement.'],
    ],
    quiz: [
      {
        enonce: 'Comment demande-t-on poliment de faire quelque chose ?',
        options: ['Forme en -て + ください', 'Forme en -ます + ください', 'Forme en -た + ください'],
        bonne: 0,
        explication: '待ってください, 見てください : la forme en -て suivie de ください est la demande polie standard.',
      },
      {
        enonce: 'Quelle est la forme en -て de 行く ?',
        options: ['行いて', '行って', '行きて'],
        bonne: 1,
        explication: '行く est irrégulier : malgré son く il fait 行って et non 行いて.',
      },
    ],
  },
  {
    id: 'teiru',
    titre: '-ている — en train de, et état',
    resume: 'Deux sens bien distincts.',
    points: [
      'La forme en -て suivie de いる décrit une action en cours : 食べています = « je suis en train de manger ».',
      'Avec certains verbes, elle décrit plutôt l’état qui résulte de l’action. 結婚しています ne veut pas dire « je suis en train de me marier » mais « je suis marié ».',
      'C’est aussi la forme des habitudes : 毎日、走っています = « je cours tous les jours ».',
      'À l’oral, le い disparaît souvent : 食べてます.',
    ],
    exemples: [
      ['子供が走っています。', 'こどもがはしっています。', 'kodomo ga hashitte imasu.', 'Un enfant est en train de courir.'],
      ['鍵を探しています。', 'かぎをさがしています。', 'kagi o sagashite imasu.', 'Je cherche mes clés.'],
      ['彼は会社で働いています。', 'かれはかいしゃではたらいています。', 'kare wa kaisha de hataraite imasu.', 'Il travaille dans une entreprise.'],
    ],
    quiz: [
      {
        enonce: 'Que signifie 知っています ?',
        options: ['Je suis en train de savoir', 'Je sais', 'Je vais savoir'],
        bonne: 1,
        explication: 'Avec 知る, la forme en -ている décrit l’état résultant : on a appris, donc on sait. La négation est en revanche 知りません.',
      },
      {
        enonce: 'Comment dit-on « Je lis en ce moment » ?',
        options: ['読みます', '読んでいます', '読みました'],
        bonne: 1,
        explication: 'La forme en -て de 読む est 読んで, à laquelle on ajoute います.',
      },
    ],
  },
  {
    id: 'tai',
    titre: '-たい — vouloir faire',
    resume: 'Un verbe qui devient adjectif.',
    points: [
      'On prend la forme en -ます, on retire ます, on ajoute たい : 食べます → 食べたい = « je veux manger ».',
      '-たい se conjugue ensuite comme un adjectif en -い : 食べたくない, 食べたかった.',
      'Il ne s’emploie qu’à la première personne, ou en question à la deuxième. Prêter un désir à un tiers demande une autre tournure — le japonais évite d’affirmer ce que ressent autrui.',
      'Le complément peut prendre が au lieu de を : 水が飲みたい.',
    ],
    exemples: [
      ['山に登りたいです。', 'やまにのぼりたいです。', 'yama ni noboritai desu.', 'Je veux grimper la montagne.'],
      ['来年、日本に行きたいです。', 'らいねん、にほんにいきたいです。', 'rainen, nihon ni ikitai desu.', 'L’an prochain, je veux aller au Japon.'],
      ['今日は何もしたくないです。', 'きょうはなにもしたくないです。', 'kyou wa nani mo shitakunai desu.', 'Aujourd’hui, je n’ai envie de rien.'],
    ],
    quiz: [
      {
        enonce: 'Comment former « je veux boire » à partir de 飲みます ?',
        options: ['飲みたい', '飲むたい', '飲みますたい'],
        bonne: 0,
        explication: 'On retire ます et on ajoute たい.',
      },
      {
        enonce: 'Peut-on dire 彼は行きたいです pour « il veut y aller » ?',
        options: ['Oui, sans problème', 'Non, -たい ne s’emploie pas pour autrui'],
        bonne: 1,
        explication: 'Le japonais réserve -たい à ce qu’on ressent soi-même. Pour un tiers, on emploie 行きたがっています ou une formule rapportée.',
      },
    ],
  },
  {
    id: 'comparer',
    titre: 'より et いちばん — comparer',
    resume: 'Plus que, et le plus.',
    points: [
      'La structure est « A は B より + adjectif » : A est plus … que B. より suit donc l’élément auquel on compare.',
      'Le japonais n’a pas de comparatif de forme : l’adjectif ne change pas, seule la structure porte la comparaison.',
      'Pour le superlatif, on emploie 一番 devant l’adjectif : 一番高い = « le plus cher ».',
      'Pour demander une préférence entre deux choses : AとBとどちらが… ?',
    ],
    exemples: [
      ['肉より魚が好きです。', 'にくよりさかながすきです。', 'niku yori sakana ga suki desu.', 'Je préfère le poisson à la viande.'],
      ['この店が一番安いです。', 'このみせがいちばんやすいです。', 'kono mise ga ichiban yasui desu.', 'Ce magasin est le moins cher.'],
      ['電車はバスより早いです。', 'でんしゃはバスよりはやいです。', 'densha wa basu yori hayai desu.', 'Le train est plus rapide que le bus.'],
    ],
    quiz: [
      {
        enonce: 'Dans AよりBが好きです, qu’est-ce qui est préféré ?',
        options: ['A', 'B'],
        bonne: 1,
        explication: 'より marque le terme écarté. C’est B, marqué par が, qui est préféré — l’inverse de l’ordre français.',
      },
      {
        enonce: 'Comment dit-on « le plus intéressant » ?',
        options: ['もっと面白い', '一番面白い', '面白いより'],
        bonne: 1,
        explication: '一番 signifie littéralement « numéro un ». もっと veut dire « davantage », sans idée de superlatif.',
      },
    ],
  },
  {
    id: 'registre',
    titre: 'Forme neutre et registres',
    resume: 'Deux façons de dire la même chose.',
    points: [
      'La forme du dictionnaire — 食べる, 行く, ある — est la forme neutre. C’est celle des amis, de la famille, et de presque tout l’écrit non adressé : livres, articles, sous-titres.',
      'La forme en -ます est polie : inconnus, collègues, commerces. Elle ne change pas le sens, seulement la relation.',
      'Les deux disent exactement la même chose. 行く et 行きます se traduisent tous deux par « j’y vais ».',
      'Conséquence pratique : les mots que tu apprends ici sont donnés en forme neutre, tandis que les phrases d’exercice sont souvent en -ます. C’est normal, et il faut savoir passer de l’un à l’autre.',
    ],
    exemples: [
      ['明日、学校に行く。', 'あした、がっこうにいく。', 'ashita, gakkou ni iku.', 'Demain, je vais à l’école. (neutre)'],
      ['明日、学校に行きます。', 'あした、がっこうにいきます。', 'ashita, gakkou ni ikimasu.', 'Demain, je vais à l’école. (poli)'],
      ['時間がない。', 'じかんがない。', 'jikan ga nai.', 'Je n’ai pas le temps. (neutre)'],
    ],
    quiz: [
      {
        enonce: 'Quelle forme emploie-t-on dans un roman ou un article ?',
        options: ['La forme en -ます', 'La forme neutre'],
        bonne: 1,
        explication: 'L’écrit non adressé à quelqu’un emploie la forme neutre. C’est pourquoi lire demande de la connaître, même si l’on parle en -ます.',
      },
      {
        enonce: '行く et 行きます diffèrent-ils par le sens ?',
        options: ['Oui, le temps change', 'Non, seul le registre change'],
        bonne: 1,
        explication: 'Même sens, même temps. Seule la relation avec l’interlocuteur diffère.',
      },
    ],
  },
];
