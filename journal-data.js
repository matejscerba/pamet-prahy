/* Shared article records for city journals and the combined directory journal. */
window.journalArticles = [
  {
    key: 'intro', pragueOnly: true, example: false,
    category: 'Introducing the project', title: 'Introducing Paměť Prahy',
    summary: 'A photographic memory of Prague, made on film and preserved for the years ahead.',
    image: './public/images/news/project-introduction.png',
    alt: 'Portrait accompanying the introduction to Paměť Prahy.',
    paragraphs: [
      'Prague changes every day. Buildings take on new uses, familiar streets are reshaped, and places we thought would always be there begin to disappear. Paměť Prahy begins with a simple intention: to make new analog records of the city while its present is still here.',
      'We want to return to the same places over time. A photograph becomes more meaningful beside another made from the same viewpoint years later. Together, they show both the visible transformations and the quieter details of everyday life.',
      'Film gives each photograph a physical original. Preserving that original alongside its date, location and digital copy connects the experience of looking online with a material record that can be cared for and revisited.',
      'The map and timeline are ways into this growing memory. Explore a place, move between its records and look closely at what changes. Future entries mark an intention to return; they are not photographs of a future that has already happened. This is the beginning of a continuing record of Prague.'
    ]
  },
  {
    key: 'bridge', pragueOnly: true, example: false,
    category: 'Prague in transition · 2026', title: 'Železniční most: a future still unwritten',
    summary: 'Nine photographs from 2026 record the bridge as it is, while the debate over its future continues.',
    image: './public/images/places/zeleznicni-most/2026/01.jpg',
    alt: 'Železniční most seen across the Vltava, photographed in 2026.',
    gallery: Array.from({length:8},(_,index)=>({src:`./public/images/places/zeleznicni-most/2026/${String(index+2).padStart(2,'0')}.jpg`,alt:`Železniční most, 2026 · photograph ${index+2}`,caption:`Železniční most · 2026 · ${String(index+2).padStart(2,'0')}/09`})),
    sources: [
      {title:'ČVUT · Discussion of the bridge’s future, 19 June 2026',url:'https://aktualne.cvut.cz/zpravy-z-medii/20260619-ryjacek-hodnota-vysehradskeho-mostu-je-v-panoramatu-ne-v-jeho-konstrukci'},
      {title:'Správa železnic · Temporary strengthening, September 2026',url:'https://etcsinfo.cz/web/guest/-/zeleznicni-most-na-vytoni-provizorne-zpevni-uhlikove-lamely'}
    ],
    paragraphs: [
      'The railway bridge between Výtoň and Smíchov belongs to the everyday image of Prague. Its steel spans sit in the river panorama beneath Vyšehrad, a familiar presence that can seem permanent precisely because we see it so often.',
      'Its future has been the subject of competing proposals. An interview published by ČVUT in June 2026 describes the debate around repair, a new crossing and the possible relocation of the existing steel structure. These are different ways of thinking about transport, heritage and the place the bridge occupies in the city.',
      'In September 2026, Správa železnic announced temporary strengthening of selected parts with carbon-fibre laminates to help maintain the existing restricted operation. Temporary measures address an immediate need; they do not turn the wider discussion into a settled photographic future.',
      'For Paměť Prahy, this uncertainty is a reason to document the bridge now. The 2026 series records a particular moment before any future transformation can be looked back on. These photographs are records of the bridge as photographed, rather than illustrations of a proposal.',
      'An archive cannot decide what should happen to a bridge. It can preserve what was there: the relationship between the structure and the river, its place in the skyline and the details we may otherwise forget. Whatever comes next, a carefully dated record gives the city a way to remember and compare.'
    ]
  },
  {
    key: 'field', otherCitiesOnly: true, category: 'Field notes', title: 'A city, one frame at a time',
    summary: 'Looking closely at the streets we pass every day—and the small changes that make them different.',
    paragraphs: [
      'A city rarely changes all at once. A shop window is replaced, a tree grows above a roofline, a familiar corner catches the light differently. Photography gives these ordinary details a place in our collective memory.',
      'Returning with a camera invites a slower kind of attention. The same viewpoint becomes a reference: not only for buildings, but for the way people use the spaces between them.',
      'This journal will bring together observations from the streets, photographs from the archive and conversations about how we document the places we share.'
    ]
  },
  {
    key: 'negative', alt: 'Gloved hands caring for physical photographic records.', category: 'Inside the archive', title: 'The life of a negative',
    summary: 'Why making a photograph is only the beginning of preserving it.',
    image: './public/images/mission/analog-archive.png',
    paragraphs: [
      'Behind a digital photograph in the archive is a physical record. A film negative holds a trace of a particular place and moment, along with the choices made by the person behind the camera.',
      'Keeping that original means caring for more than an image. Dates, locations and notes help a future viewer understand what they are looking at. Careful handling and storage allow the physical record to remain available alongside its digital copy.',
      'Our mission starts with making new analog photographs and continues through the patient work of organising, describing and returning to them.'
    ]
  },
  {
    key: 'street', category: 'Ways of looking', title: 'Return to the same street',
    summary: 'A simple practice for noticing time: find a viewpoint, make a photograph, come back.',
    paragraphs: [
      'Choose a place you know well. Look for a viewpoint that can be found again: a doorway, the edge of a square, a crossing. Make a photograph and note where you stood.',
      'On the next visit, the scene may seem unchanged. Place the photographs side by side and details begin to emerge: different signs, new surfaces, shifting patterns of movement.',
      'Repeated photographs do not need a dramatic transformation to matter. They make the passage of time visible and give everyday places a record of their own.'
    ]
  }
];
