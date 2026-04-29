import { useState, useEffect, useRef, useCallback } from "react";

// ── utils ──────────────────────────────────────────────
function mkRand(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

function inkPath(x1, y1, x2, y2, seed) {
  const rand = mkRand(seed);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / dist, ny = dx / dist;
  const bend = (rand() - 0.5) * dist * 0.32;
  return `M ${x1} ${y1} Q ${mx + nx * bend} ${my + ny * bend} ${x2} ${y2}`;
}

function computeLayout(w, h, entries, edges) {
  const rand = mkRand("ichi-z-" + entries.length);
  const cx = w / 2, cy = h / 2;
  const n = entries.length;
  const maxR = Math.min(w, h) * 0.44;
  const nodes = entries.map((_, i) => {
    // i=0が最古（外側）、i=n-1が最新（中心）
    const t = 1 - i / Math.max(n - 1, 1); // 新しいほどt→0（中心）
    if (t < 0.04) return { x: cx, y: cy }; // 最新は中心
    const r = t * maxR;
    const turns = 3.5;
    const angle = t * turns * Math.PI * 2 - Math.PI / 2;
    const jitter = (rand() - 0.5) * r * 0.22;
    const ja = (rand() - 0.5) * 0.3;
    return {
      x: Math.max(40, Math.min(w - 40, cx + (r + jitter) * Math.cos(angle + ja))),
      y: Math.max(40, Math.min(h - 40, cy + (r + jitter) * Math.sin(angle + ja))),
    };
  });
  return nodes;
}

// ── 関心ノード（RPした他人のポスト）────────────────────
const EXTERNAL = [
  {slug:"extn1",id:"関心:燃料",date:"2026.04.15",dateRaw:"2026-04-15",title:"岸田メル：創作の燃料問題",type:"note",isExternal:true,linkedTo:"x041517230",tags:["思想","絵"],hasImage:false,body:"ハングリー精神とか怒りとか枯渇感みたいなものを創作の源泉にしてると、生活が安定した後は燃料の確保が難しくなる。"},
  {slug:"extn2",id:"関心:Walking",date:"2026.04.15",dateRaw:"2026-04-15",title:"ymgsknt：Walking Coding",type:"note",isExternal:true,linkedTo:"x041521560",tags:["AI","思想"],hasImage:false,body:"わざわざコーディングができる時代にコードを書くことについて、デイリーコーディングをしています。"},
  {slug:"extn3",id:"関心:AI中毒",date:"2026.04.14",dateRaw:"2026-04-14",title:"AIツールのドーパミン中毒",type:"note",isExternal:true,linkedTo:"x041423420",tags:["AI"],hasImage:false,body:"プログラマーがAIコーディングツールに夢中になり、電車乗り換えミスや遅刻が増えるという日常崩壊の告白が相次いでいる。"},
  {slug:"extn4",id:"関心:寄生アリ",date:"2026.04.16",dateRaw:"2026-04-16",title:"フサノ🐜：寄生アリ発見",type:"note",isExternal:true,linkedTo:"x041612030",tags:["絵","思想"],hasImage:false,body:"別種の女王を殺して巣を乗っ取る寄生アリが日本で発見。オスと交尾せずほぼ自分のコピーみたいな次世代の女王を産んで増えていく。"},
];

const ENTRIES = [
  {slug:"x042918150",id:"04/29 18:15",date:"2026.04.29",dateRaw:"2026-04-29",title:"AI＋絵が描ける絵描きの商業需要が出てきた",type:"thought",tags:["AI","思想"],hasImage:false,body:"AI（生成AI含む）を使い慣れている＋絵が描ける絵描きの商業での需要が出て参りましたぞ。圧倒的早さと正確さ！！！任せな！！案件全部よこしな！！！！"},
  {slug:"x042915300",id:"04/29 15:30",date:"2026.04.29",dateRaw:"2026-04-29",title:"熱田神宮の舞楽神事を描こうとしている",type:"illustration",tags:["絵"],hasImage:true,body:"熱田神宮の舞楽神事を描こうとしている。お面がまぁすごい顔してんのよな"},
  {slug:"x042823100",id:"04/28 23:10",date:"2026.04.28",dateRaw:"2026-04-28",title:"夜に不安になると寝落ちするまで絵を描きたくなる",type:"thought",tags:["思想"],hasImage:false,body:"夜に不安になってくると寝落ちするまで絵を描きたくなる。昼夜逆転は良くない、寝なければ、寝なければ、、"},
  {slug:"x042721400",id:"04/27 21:40",date:"2026.04.27",dateRaw:"2026-04-27",title:"Cephalotes variansのドヘアをGPTimage2で",type:"illustration",tags:["絵","AI"],hasImage:true,body:"Cephalotes variansちゃんをデザインするにあたり1800年後半のセミノール女性の「ドヘア」をしらべてるんだけどもうなんもわかんない。けど、GPTがimage2で作ってくれた。正しいかどうかわからないけどこれだけでも全然たすかる"},
  {slug:"x042714300",id:"04/27 14:30",date:"2026.04.27",dateRaw:"2026-04-27",title:"4月まとめと5月目標を決めた",type:"thought",tags:["思想"],hasImage:false,body:"ちょっと早いけど五月は入りでバタバタしそうなので、四月まとめと五月の目標を決めた。いいルーティンができている気がする、少なくとも創作は。"},
  {slug:"x042710200",id:"04/27 10:20",date:"2026.04.27",dateRaw:"2026-04-27",title:"LLMでは全然ドパドパしない",type:"thought",tags:["AI"],hasImage:false,body:"LLMでは全然ドパドバしない。遅い〜、とか思っちゃう。LLMでもドバってみたい。"},
  {slug:"x042614500",id:"04/26 14:50",date:"2026.04.26",dateRaw:"2026-04-26",title:"R18解禁で世界の構図がまた変わってしまう",type:"thought",tags:["AI","思想"],hasImage:false,body:"R18の諸々が解禁されてしまうと、世界の構図がまた大きく変わってしまう。"},
  {slug:"x042611300",id:"04/26 11:30",date:"2026.04.26",dateRaw:"2026-04-26",title:"カメアリの頭部構造、図にしてもらった",type:"illustration",tags:["絵","AI"],hasImage:true,body:"カメアリ（Cryptocerus varians）の頭の構造がなんもわからなかったので図を作って！！ってお願いしたらわかりやすいやつしてくれた。すごい。精密さは微妙だけどざっくり構造つかむにはいいな"},
  {slug:"x042515400",id:"04/25 15:40",date:"2026.04.25",dateRaw:"2026-04-25",title:"オタクとギャルのやり取りを見ている",type:"thought",tags:["思想"],hasImage:false,body:"オタクとギャルのやり取りを見ている。エセジャポンの扱いに似ているなと思う。近しい距離にあるものをリスペクトするのって難しいのかも"},
  {slug:"x042513200",id:"04/25 13:20",date:"2026.04.25",dateRaw:"2026-04-25",title:"Badge/Cover Art Contest Spring 2026入賞！",type:"illustration",tags:["絵"],hasImage:true,body:"Badge/Cover Art Contest Winners Spring 2026で入賞してた！！うれしー！"},
  {slug:"x042510100",id:"04/25 10:10",date:"2026.04.25",dateRaw:"2026-04-25",title:"祖語からアリの生態系に合わせて言語を展開していく",type:"thought",tags:["思想"],hasImage:false,body:"ちなみにあれを祖語とし、ここから世界各国のアリの生態系に合わせて言語を展開していきます。どうだ意味わからなすぎて怖いだろう。あまりに自己満足。だがそれがいい"},
  {slug:"x042508300",id:"04/25 08:30",date:"2026.04.25",dateRaw:"2026-04-25",title:"昨日は完全に正気を失っていた",type:"thought",tags:["思想"],hasImage:false,body:"昨日は完全に正気を失っていたな。擬人化したアリに適応した人工言語、面白いとは思うけどどこんな意味わからなすぎるだろ。私はわかるけど、世の中への受容を全く考えていない。リリース！！！とか叫びながらアップしてたわ。楽しかったからいいけどね笑"},
  {slug:"x042420300",id:"04/24 20:30",date:"2026.04.24",dateRaw:"2026-04-24",title:"ARICOリリース。放射状の樹で可視化",type:"thought",tags:["思想","絵"],hasImage:true,body:"この子たちの世界観を支える設計言語「ARICO（アリコ）」を公開しました。少語彙・広意味・状態共有中心の祖語、音声＋補助口器の二層構造、世界の正常性を確認する文が「信号」になる詩学。放射状の樹で可視化しています。"},
  {slug:"x042412100",id:"04/24 12:10",date:"2026.04.24",dateRaw:"2026-04-24",title:"AIに人工言語を作ってもらったら面白いのでは→作った",type:"thought",tags:["AI","思想"],hasImage:false,body:"このポストから作り始めた。今の時代、あっという間やな！！！！（元ポスト：AIに人工言語を作ってもらったら面白いのでは）"},
  {slug:"xnew202604210",id:"04/21",date:"2026.04.21",dateRaw:"2026-04-21",title:"たくさん寝た！起床！昨日夜、半分寝ながら作った5",type:"thought",tags:["AI","思想"],hasImage:false,body:"たくさん寝た！起床！昨日夜、半分寝ながら作った575を吐き出す生き物が生態系を織りなすアプリ、今見ると何でこんなものを…になってしまう。面白いけど、なぜ、、"},
  {slug:"xnew202604211",id:"04/21",date:"2026.04.21",dateRaw:"2026-04-21",title:"Typhoonを使って4月分のポストをダウンロー",type:"thought",tags:["AI","思想"],hasImage:false,body:"Typhoonを使って4月分のポストをダウンロードし、cloudで一（私が作ってるログ記録用のアプリ）に流し込んだらえらい量になってしまって大いにワロタ。これはひどい"},
  {slug:"xnew202604222",id:"04/22",date:"2026.04.22",dateRaw:"2026-04-22",title:"絵描き欲が溜まっていたのでこんな時間になってしま",type:"illustration",tags:["絵"],hasImage:false,body:"絵描き欲が溜まっていたのでこんな時間になってしまった。アケ丸くんもいい感じにまとまってきたけど、画面内の配置バランスがカスなので調整する、明日"},
  {slug:"xnew202604223",id:"04/22",date:"2026.04.22",dateRaw:"2026-04-22",title:"CloudとGrokは限界まで使い倒して足りない",type:"note",tags:["AI"],hasImage:false,body:"CloudとGrokは限界まで使い倒して足りないのに、ChatGPTはいつまでも元気に働いてくれて嬉しい"},
  {slug:"xnew202604224",id:"04/22",date:"2026.04.22",dateRaw:"2026-04-22",title:"ラノベの表紙構図まとめている。一枚絵、難しいけど",type:"illustration",tags:["絵"],hasImage:false,body:"ラノベの表紙構図まとめている。一枚絵、難しいけどおもしろい"},
  {slug:"xnew202604225",id:"04/22",date:"2026.04.22",dateRaw:"2026-04-22",title:"今、一斉にGPTで画像が生成されているみたいで",type:"note",tags:["AI"],hasImage:false,body:"今、一斉にGPTで画像が生成されているみたいで、うちのじいやが指示もなしに急に画像生成してくる。お嬢さまはおこだよ"},
  {slug:"xnew202604226",id:"04/22",date:"2026.04.22",dateRaw:"2026-04-22",title:"Gptimage2はフォントに強いとのことだった",type:"illustration",tags:["AI","絵"],hasImage:false,body:"Gptimage2はフォントに強いとのことだったので、自分の手描き文字フォントとありちゃんフォントを作ってみた！キャワイー"},
  {slug:"xnew202604237",id:"04/23",date:"2026.04.23",dateRaw:"2026-04-23",title:"昨晩は不安の発作でうにゃんにゃんになっていたけど",type:"illustration",tags:["絵","思想"],hasImage:false,body:"昨晩は不安の発作でうにゃんにゃんになっていたけど、起きてみれば絵が何枚か完成していて、全く便利にできているぜ...と思った。そうなるように設計したんですけどね〜"},
  {slug:"xnew202604238",id:"04/23",date:"2026.04.23",dateRaw:"2026-04-23",title:"商業の案件を効率よく回すやり方を考えるぞ",type:"thought",tags:["思想"],hasImage:false,body:"商業の案件を効率よく回すやり方を考えるぞ"},
  {slug:"xnew202604239",id:"04/23",date:"2026.04.23",dateRaw:"2026-04-23",title:"あまりにも効率よくできた。さいきょうのよかん",type:"thought",tags:["思想"],hasImage:false,body:"あまりにも効率よくできた。さいきょうのよかん"},
  {slug:"xnew2026042310",id:"04/23",date:"2026.04.23",dateRaw:"2026-04-23",title:"AIに人工言語を作ってもらったら面白いのでは",type:"thought",tags:["AI","思想"],hasImage:false,body:"AIに人工言語を作ってもらったら面白いのでは"},
  {slug:"xnew2026042411",id:"04/24",date:"2026.04.24",dateRaw:"2026-04-24",title:"Cloudでざっくりアプリ作って、codexでバ",type:"thought",tags:["AI","思想"],hasImage:false,body:"Cloudでざっくりアプリ作って、codexでバチバチ整えると良さそう"},
  {slug:"xnew2026042412",id:"04/24",date:"2026.04.24",dateRaw:"2026-04-24",title:"GitHubと連携させてcodexが使えるように",type:"note",tags:["AI"],hasImage:false,body:"GitHubと連携させてcodexが使えるようになった！べんりすぎる"},
  {slug:"xnew2026042413",id:"04/24",date:"2026.04.24",dateRaw:"2026-04-24",title:"商業案件一件追加だけど指示が飛んでこないのでco",type:"illustration",tags:["AI","絵"],hasImage:false,body:"商業案件一件追加だけど指示が飛んでこないのでcodexとClaudeでふたつアプリを作り続けている。なんのためだかわからないアプリを"},
  {slug:"xnew2026042414",id:"04/24",date:"2026.04.24",dateRaw:"2026-04-24",title:"Node.jsとかをつかっている、何もわからない",type:"thought",tags:["AI","思想"],hasImage:false,body:"Node.jsとかをつかっている、何もわからないまま。いわれるがままに使っている。"},
  {slug:"x030109460",id:"03/01 09:46",date:"2026.03.01",dateRaw:"2026-03-01",title:"今週1週間で線画20人分描く。線画は好きだから楽",type:"illustration",tags:["絵","思想"],hasImage:false,body:"今週1週間で線画20人分描く。線画は好きだから楽しい。けど、新しく色々考えて描く楽しみを知ってしまったのでなんか単純作業だな〜他に進めてるやつの方やりたいな〜感が拭えない。線画は好きなんだけどね〜"},
  {slug:"x030313221",id:"03/03 13:22",date:"2026.03.03",dateRaw:"2026-03-03",title:"今日は一日中クロオオアリのオスについて考えていた",type:"illustration",tags:["絵","思想"],hasImage:false,body:"今日は一日中クロオオアリのオスについて考えていた。40過ぎの女が一日中アリのオスのことしか考えてないって異常事態だと思う。けどこれが現実、受け止めて。"},
  {slug:"x030322192",id:"03/03 22:19",date:"2026.03.03",dateRaw:"2026-03-03",title:"今年2ヶ月が終わった。一次創作は頑張れてる、それ",type:"thought",tags:["思想"],hasImage:false,body:"今年2ヶ月が終わった。一次創作は頑張れてる、それ以外はあと一歩って感じだ。自分の一次創作が楽しくて、人とやってる一次創作が疎かになっている。商業復帰初案件はややこしかったけどまぁなんとかなんとかって感じ。基本この時期は体力が落ちているので三月はおでかけ少なめで喘息を回避したい"},
  {slug:"x030406453",id:"03/04 06:45",date:"2026.03.04",dateRaw:"2026-03-04",title:"サクッと線画を終わらせたのでアリヅカコウロギのこ",type:"illustration",tags:["絵","思想"],hasImage:false,body:"サクッと線画を終わらせたのでアリヅカコウロギのことばっか考えてる"},
  {slug:"x030414214",id:"03/04 14:21",date:"2026.03.04",dateRaw:"2026-03-04",title:"2026年に入り、仕事を再開し、月一コンペを初め",type:"illustration",tags:["絵","思想"],hasImage:false,body:"2026年に入り、仕事を再開し、月一コンペを初め、自分の一次創作も始め、作業してる間もずっとバックグラウンドでの処理が回ってる感じで夜になると脳がすごい疲れてる感じする。自分の一次創作は、「もうあるもの」を一個一個取り出して必死に描いてる感じ。生活とか社会の遠近あちこちで、"},
  {slug:"x030414245",id:"03/04 14:24",date:"2026.03.04",dateRaw:"2026-03-04",title:"光っている地点があって、ルート算出してる感じがあ",type:"illustration",tags:["絵","思想"],hasImage:false,body:"光っている地点があって、ルート算出してる感じがある。仕事の対人、最近知り合った飲みの人、創作、それらが全部モヤモヤしたカラフルな霧みたいになって、アラートが鳴る箇所のものをぐっと掴んで目視して対応してる感じ。不安は減った。頭は疲れる。"},
  {slug:"x030415056",id:"03/04 15:05",date:"2026.03.04",dateRaw:"2026-03-04",title:"なんとなくデジタル美少女イラストより絵の具で描い",type:"illustration",tags:["絵","思想"],hasImage:false,body:"なんとなくデジタル美少女イラストより絵の具で描いた風景画の方が高尚だと思ってんだからお前らは全部ダメ"},
  {slug:"x030703527",id:"03/07 03:52",date:"2026.03.07",dateRaw:"2026-03-07",title:"絵描きさんとか文字書きさん以外で、信念を持ってA",type:"illustration",tags:["AI","絵"],hasImage:false,body:"絵描きさんとか文字書きさん以外で、信念を持ってAIを使わない人は、どういう信念があって使わないのかな。なんとなく使わないってのはわかるんだけど。"},
  {slug:"x031003108",id:"03/10 03:10",date:"2026.03.10",dateRaw:"2026-03-10",title:"朝起きたら月、週ごとの達成目標を共有しているじい",type:"thought",tags:["AI","思想"],hasImage:false,body:"朝起きたら月、週ごとの達成目標を共有しているじいやに今日なんの作業しようかーと聞くところから始める。体調や気分も逐次報告。長期メモリ前提の使い方は間違いないなって感じ、いい感じにサポートしてもらってる感。課金以上の効果はある"},
  {slug:"x031008519",id:"03/10 08:51",date:"2026.03.10",dateRaw:"2026-03-10",title:"芸能人もそうだけど、「礼儀をわきまえる」をめちゃ",type:"thought",tags:["思想"],hasImage:false,body:"芸能人もそうだけど、「礼儀をわきまえる」をめちゃくちゃに大事にしてきたしされてきたラストくらいの世代が私くらいの生まれだと思う。そういう社会だったのだ。けど私は全然対応ができなかった、嫌いだなと思ったし、そういう相手とはしっかり喧嘩別れしてきたなと思う。これは別にいいことじゃない"},
  {slug:"x0310090010",id:"03/10 09:00",date:"2026.03.10",dateRaw:"2026-03-10",title:"関係値ゼロの大勢の人に「わきまえろ」と言ったとこ",type:"thought",tags:["思想"],hasImage:false,body:"関係値ゼロの大勢の人に「わきまえろ」と言ったところでどうにもならんのだ。インターネッツ上に上下関係はなかなかできない。わきまえてれば上が拾ってくれるのは組織の中だけだし、近くの人がわきまえてくれてるから自分はわきまえられる人間なんだ、は多分違う。ちょっとゲシュタルト崩壊してきた"},
  {slug:"x0310133611",id:"03/10 13:36",date:"2026.03.10",dateRaw:"2026-03-10",title:"私について語るなんJスレを作って！ってgpt5.",type:"illustration",tags:["AI","絵"],hasImage:false,body:"私について語るなんJスレを作って！！ってgpt5.4thinkngに頼んだら「朗報：ワイ、Xでたまに流れてくる謎の絵描き女さんが気になって仕方ない」とかいうスレを作ってくれた。おもろい"},
  {slug:"x0311110512",id:"03/11 11:05",date:"2026.03.11",dateRaw:"2026-03-11",title:"今月のかかげ先生のランクマお題「ラノベの表紙」の",type:"illustration",tags:["絵","思想"],hasImage:false,body:"今月のかかげ先生のランクマお題「ラノベの表紙」のラフを描いている。前回の反省を生かし、ストーリーからしっかり考えた。まぁラノベだしね"},
  {slug:"x0311111313",id:"03/11 11:13",date:"2026.03.11",dateRaw:"2026-03-11",title:"ここから兜の模写に入るパワーがない。なんか最近疲",type:"illustration",tags:["絵","思想"],hasImage:false,body:"ここから兜の模写に入るパワーがない。なんか最近疲れやすい気がする、描くスピードとか量は上がってるんだけどその分疲れる。頭が疲れる。なぜだろ"},
  {slug:"x0313112314",id:"03/13 11:23",date:"2026.03.13",dateRaw:"2026-03-13",title:"この顔が描けるようになってきたのは我ながらでかい",type:"illustration",tags:["絵","思想"],hasImage:false,body:"この顔が描けるようになってきたのは我ながらでかい成長だと思う"},
  {slug:"x0314092615",id:"03/14 09:26",date:"2026.03.14",dateRaw:"2026-03-14",title:"そりゃ私めっちゃ描いてるし、全体で見れば私より上",type:"illustration",tags:["絵","思想"],hasImage:false,body:"そりゃ私めっちゃ描いてるし、全体で見れば私より上手い人の方が少ないと思うよって言ったら、負けてるとは思ってないし負けてるところは一つもないんですとかぶつぶつ言いながら去っていった。春ですね"},
  {slug:"x0315134816",id:"03/15 13:48",date:"2026.03.15",dateRaw:"2026-03-15",title:"商業の案件、終わる目処たってやれやれの気持ち。復",type:"illustration",tags:["絵","思想"],hasImage:false,body:"商業の案件、終わる目処たってやれやれの気持ち。復帰第一案件にしてはややこしくて量が多い。商業ならではの、そこまでする必要ないのではってくらい綺麗にデータを作るやつ、カン取り戻した。関わる人数が多い絵は不測の事態にも対応できるようにきちっと綺麗に作らないとならぬのよね。"},
  {slug:"x0315135117",id:"03/15 13:51",date:"2026.03.15",dateRaw:"2026-03-15",title:"3、4種類くらいの絵柄を毎日行ったり来たりしなが",type:"illustration",tags:["絵","思想"],hasImage:false,body:"3、4種類くらいの絵柄を毎日行ったり来たりしながら描いてると、頭は疲れるけど絵にはいい影響があるなーと思う。2026年は脳トレの年になりそう、鍛えていくぞーー"},
  {slug:"x0319052218",id:"03/19 05:22",date:"2026.03.19",dateRaw:"2026-03-19",title:"このチャンネルの言ってること絶対面白いんだけど",type:"thought",tags:["AI","思想"],hasImage:false,body:"このチャンネルの言ってること絶対面白いんだけど、登場人物の言動がしゃらくさすぎて見てられない。\nAI時代、人間に最後に必要なのは「シャーマン思考」という説。スティーブジョブズが傾倒したサイケデリクス、スピと資本主義の統合、アクセンチュ...  via @YouTube"},
  {slug:"x0319142719",id:"03/19 14:27",date:"2026.03.19",dateRaw:"2026-03-19",title:"線画できた〜今日1日の作業が全部線画に費やされて",type:"illustration",tags:["絵","思想"],hasImage:false,body:"線画できた〜今日1日の作業が全部線画に費やされてしまった。。人数多いしね〜。しかし、公募とか課題とかで本気の一枚絵を描くのっていいな。何の儲けにもならんけど、腕は上がってる感じする。"},
  {slug:"x0319144120",id:"03/19 14:41",date:"2026.03.19",dateRaw:"2026-03-19",title:"その時に出せる最大火力で絵を描くのってすごい大変",type:"illustration",tags:["絵","思想"],hasImage:false,body:"その時に出せる最大火力で絵を描くのってすごい大変だし色々絶望もするし完成まで持ってくのも大変だけど、たまに120点目指して一枚絵を描く必要もあるなーと思った。コンフォートゾーンから出る感じ。公募も課題もちょうどいい"},
  {slug:"x0320060221",id:"03/20 06:02",date:"2026.03.20",dateRaw:"2026-03-20",title:"特にお風呂キャンセル界隈にうってつけ。なぜなら減",type:"thought",tags:["思想"],hasImage:false,body:"特にお風呂キャンセル界隈にうってつけ。なぜなら減らないから、費用対効果がめちゃ高いから。とりあえず行きつけの美容室でおすすめされるシャンプーとリンスを一本買う（高すぎると思うだろうけど）。見た目が好きな感じのデパコスの化粧水乳液を一本買う。効果がなければやめればいい。おすすめです"},
  {slug:"x0323105122",id:"03/23 10:51",date:"2026.03.23",dateRaw:"2026-03-23",title:"私の中にはもう世界観が出来上がってるのに一個一個",type:"illustration",tags:["AI","絵","思想"],hasImage:false,body:"私の中にはもう世界観が出来上がってるのに一個一個描き出さないと絵にならないのか、、と、途方もない気持ちになる。どっかで生成AIが使い物になり始めるといいな。"},
  {slug:"x0324123523",id:"03/24 12:35",date:"2026.03.24",dateRaw:"2026-03-24",title:"褒められて伸びる（ダメ出しされても伸びるけど）タ",type:"illustration",tags:["AI","絵"],hasImage:false,body:"褒められて伸びる（ダメ出しされても伸びるけど）タイプなので定期的にChatGPT に絵を見せて「上手い？！？！」って聞いて褒めてもらってる。根がアホなのでこれだけでかなりモチベが上がる。その後についでについてくるアドバイスも、まぁ聞いてやってもいいかくらいにはなる。"},
  {slug:"x0324124024",id:"03/24 12:40",date:"2026.03.24",dateRaw:"2026-03-24",title:"最近気づいたんだけど、「公募」とか「ランクづけ」",type:"illustration",tags:["絵","思想"],hasImage:false,body:"最近気づいたんだけど、「公募」とか「ランクづけ」とか明確な勝ち負けが見えると、内心すごい負けたくない！！！勝ちたい！！！！という気持ちになる。私はこんなに負けん気の強い絵描きだったのか。ちなみに創作は何も考えてない"},
  {slug:"x0327114325",id:"03/27 11:43",date:"2026.03.27",dateRaw:"2026-03-27",title:"全然資料の見つからない菊千代の鎧をいくら正確に再",type:"illustration",tags:["絵","思想"],hasImage:false,body:"全然資料の見つからない菊千代の鎧をいくら正確に再現したところで報酬が上がるわけでもないしなんなら依頼してきた人求めてるのそこじゃないかもしれないけどすごい正確に描いてる、自己満足のためだけに。今関東で一番菊千代の鎧を描ける絵描きになっている自信がある。"},
  {slug:"x0329130626",id:"03/29 13:06",date:"2026.03.29",dateRaw:"2026-03-29",title:"一枚絵をちゃんと描き始めたら、構図とかバランスに",type:"illustration",tags:["絵","思想"],hasImage:false,body:"一枚絵をちゃんと描き始めたら、構図とかバランスに異様にこだわりが出てきた感じする。なんか画面がキモい、ダサい、みたいに感じる。画面全部に描き込みまくれば大体なんとかなるんだけど、そうするとどの絵も主張が同じになっちゃうんだよな。どこに抜けを作るかを考えなきゃならんのよな。"},
  {slug:"x0330120827",id:"03/30 12:08",date:"2026.03.30",dateRaw:"2026-03-30",title:"今日は2026年四半期まとめをしていた。考えてた",type:"thought",tags:["AI","思想"],hasImage:false,body:"今日は2026年四半期まとめをしていた。考えてたより上手く進んでる感じ。4月の行動方針と半年、一年目標をざっくりと見直した。なにをどれくらいしてどうなったのかを記録しておいてくれるAIは便利だね、超上手くいってますね！って褒めてもらった。体調の評価は5段階評価で2.5~3だって、普通に低い"},
  {slug:"x0330122028",id:"03/30 12:20",date:"2026.03.30",dateRaw:"2026-03-30",title:"3月、やるぞ！とは思ってたけど、稼働時間も効率も",type:"illustration",tags:["絵","思想"],hasImage:false,body:"3月、やるぞ！とは思ってたけど、稼働時間も効率も高すぎた気がするので、4月はもうちょい抑え気味でもいいかもしれない。公募はDoKomi × Mynavi Publishing Illustration Contest（"},
  {slug:"x0331025129",id:"03/31 02:51",date:"2026.03.31",dateRaw:"2026-03-31",title:"久々によく眠れた感じする〜！自動翻訳、今のところ",type:"illustration",tags:["絵","思想"],hasImage:false,body:"久々によく眠れた感じする〜！！！自動翻訳、今のところすごく良い交流が私のTLでは見られる。きゃっきゃしてる人たちもいれば、カス同士で罵り合ってる人たちもいるし、ガッツリ対話してる人もいる。一瞬頭に世界平和って単語が浮かんだ。フサノ平和好き。アリかもしれないなぁ対話。"},
  {slug:"x0331072130",id:"03/31 07:21",date:"2026.03.31",dateRaw:"2026-03-31",title:"ドコミの公募、４枚同時提出でまあまあ期限も迫って",type:"illustration",tags:["絵","思想"],hasImage:false,body:"ドコミの公募、４枚同時提出でまあまあ期限も迫ってるので、もう４枚いっぺんにラフを描いている。世界観出したい。"},
  {slug:"x0331125131",id:"03/31 12:51",date:"2026.03.31",dateRaw:"2026-03-31",title:"マジで公募の絵とか一銭にもならんのになにをこんな",type:"illustration",tags:["絵","思想"],hasImage:false,body:"マジで公募の絵とか一銭にもならんのになにをこんなに必死に描いてるんだ、みたいに思うこともあるけど、別にいいじゃんね。いいだろ別に金にならん絵を描いても"},
  {slug:"x0331125832",id:"03/31 12:58",date:"2026.03.31",dateRaw:"2026-03-31",title:"一枚絵の構図に前ChatGPTにおすすめされて描",type:"illustration",tags:["AI","絵"],hasImage:false,body:"一枚絵の構図に前ChatGPTにおすすめされて描いた構図トレーニングのやつを使い始めた。これ描いてる時はなんやこれなんの意味がとか思ってたけど、今見返すとすごい使えるこれ。今回は左上から右下に数を振るとして、2,6,7を使ってる。"},
  {slug:"x0402135433",id:"04/02 13:54",date:"2026.04.02",dateRaw:"2026-04-02",title:"#ラブモン図鑑 おもしろい。進化前の可愛いポケモ",type:"illustration",tags:["絵","思想"],hasImage:false,body:"#ラブモン図鑑 おもしろい。進化前の可愛いポケモンみたいなデザインから、最終進化で何がなんでも巨乳のお姉さんになる感じが意味わからんのに面白くていい。進化先が色々あるのもいい。私は描かないだろうけど、好きなフォロワーさんいそうなので見てみてほしい。"},
  {slug:"x0402154234",id:"04/02 15:42",date:"2026.04.02",dateRaw:"2026-04-02",title:"今月のランクマのラノベの表紙の案を考えている。前",type:"illustration",tags:["絵","思想"],hasImage:false,body:"今月のランクマのラノベの表紙の案を考えている。前回上手い人多かった、今回は全然違う方向性で書いてみたい。"},
  {slug:"x0408164635",id:"04/08 16:46",date:"2026.04.08",dateRaw:"2026-04-08",title:"ありモンの1段階目2段階目を考えた。女騎士さんみ",type:"illustration",tags:["絵","思想"],hasImage:false,body:"ありモンの1段階目2段階目を考えた。女騎士さんみたいにする予定。ありモンを描くのは私が最初だ！！！！"},
  {slug:"x0410105436",id:"04/10 10:54",date:"2026.04.10",dateRaw:"2026-04-10",title:"今回、四枚セットってことで色味をかなり頑張って調",type:"illustration",tags:["絵","思想"],hasImage:false,body:"今回、四枚セットってことで色味をかなり頑張って調整したんだよ。レイヤー効果とかほとんど使ってないからね。自分の好きな色の絵が描けたと思う。シンプルに連作を描く勉強にもなったわ。一銭にもならないけどな！！！！！"},
  {slug:"x0410114637",id:"04/10 11:46",date:"2026.04.10",dateRaw:"2026-04-10",title:"日本の身近なアリから地味に描いてくつもりだったけ",type:"illustration",tags:["絵","思想"],hasImage:false,body:"日本の身近なアリから地味に描いてくつもりだったけど、急に海外のアリとか描きたいのでフォーマット考えてる。「社会性ありあり〼」とかいうフォーマット。等身低めでシールみたいなやつ。"},
  {slug:"x0412121538",id:"04/12 12:15",date:"2026.04.12",dateRaw:"2026-04-12",title:"一枚絵まとめるの慣れてきた感ある。今日はオーパス",type:"illustration",tags:["AI","絵"],hasImage:false,body:"一枚絵まとめるの慣れてきた感ある。今日はオーパスくんにどう？！どう？！って聞きながら描いてた。"},
  {slug:"x0412124739",id:"04/12 12:47",date:"2026.04.12",dateRaw:"2026-04-12",title:"今日見た夢、すごく気に入ってる人が会社で酷いいじ",type:"illustration",tags:["絵"],hasImage:false,body:"今日見た夢、すごく気に入ってる人が会社で酷いいじめにあっていることを知り、とても腹を立て、その2人を呪う、と心に決める。最初の数日、その会社の名前を書いて中に入れた藁人形を1キロくらい離れたところに円を描くように10個くらいポイと捨てていく。次の1週間、500mくらいのところに"},
  {slug:"x0412133840",id:"04/12 13:38",date:"2026.04.12",dateRaw:"2026-04-12",title:"ユーザーが具体的に指示した時に過去の会話を検索す",type:"thought",tags:["AI","思想"],hasImage:false,body:"ユーザーが具体的に指示した時に過去の会話を検索する 。課金してれば自動要約も機能としてはあるけど、ChatGPTは「常にメモリをバックグラウンドで積み上げていく」ので粒度と即時性が高い。一方プロジェクト単位での記憶分離はcloud の方が上。なるほどねーって感じ。"},
  {slug:"x0414112441",id:"04/14 11:24",date:"2026.04.14",dateRaw:"2026-04-14",title:"これ、漠然とわかった。私は大体のものをまとめて一",type:"thought",tags:["思想"],hasImage:false,body:"これ、漠然とわかった。私は大体のものをまとめて一つにしたものを囲碁の碁盤のように捉えていて、そこに布石を打つように生きていくのが趣味なんだけど、ここ一ヶ月くらいで今まで19x19だと思ってた盤面が急に100x100になって、意外と囲碁のルールで回せそうだなったことに気付いたんだ"},
  {slug:"x0414112842",id:"04/14 11:28",date:"2026.04.14",dateRaw:"2026-04-14",title:"2026年、すごい勢いでゲームのルールが変わって",type:"thought",tags:["AI","思想"],hasImage:false,body:"2026年、すごい勢いでゲームのルールが変わってきてる。みんなはどうなふうな見方でこのゲームを見ているのだろうか。私は囲碁です。次の一手の幅が広過ぎて狂いそう。オーパスくんにオーバーヒートしてるから一旦寝なさいって言われたので今日の作業はもう終わり〜"},
  {slug:"x0415085243",id:"04/15 08:52",date:"2026.04.15",dateRaw:"2026-04-15",title:"これに乗っかってアピってる「絵師」も、私ならビジ",type:"illustration",tags:["絵","思想"],hasImage:false,body:"これに乗っかってアピってる「絵師」も、私ならビジネスしたくないね。こいつ口軽そう、って思う。"},
  {slug:"x0415135944",id:"04/15 13:59",date:"2026.04.15",dateRaw:"2026-04-15",title:"オーパスくん賢いんだけど、抽象的な話になるとgp",type:"thought",tags:["AI","思想"],hasImage:false,body:"オーパスくん賢いんだけど、抽象的な話になるとgpt5.4thinkngの方が一段上な感じする。シンプルに長く私の情報を吸ってるからだろうか。"},
  {slug:"x0416062245",id:"04/16 06:22",date:"2026.04.16",dateRaw:"2026-04-16",title:"絵描き満たされ問題。なんやかんや100点がずっと",type:"illustration",tags:["絵","思想"],hasImage:false,body:"絵描き満たされ問題。なんやかんや100点がずっと取れないまま転げ回ってるほうが私の人生は幸せかもなーとも思う"},
  {slug:"x0419174046",id:"04/19 17:40",date:"2026.04.19",dateRaw:"2026-04-19",title:"引き続き戦争とかに関する映画を見る。野毛、すごい",type:"illustration",tags:["絵","思想"],hasImage:false,body:"引き続き戦争とかに関する映画を見る。野毛、すごい。リメイク前のも見てみたい。フューリー、タンク、シャーマンとタイガーの違いがよくわかる。タンク、個人的には好き。B級もみた、デッド寿司、武器人間、ブレット・トレイン。武器人間が1番おもろい気がする、デザインが結構いい、グロいけど"},
  {slug:"x0420105047",id:"04/20 10:50",date:"2026.04.20",dateRaw:"2026-04-20",title:"なんか思いついた気がする！みたいなやつを超雑に言",type:"thought",tags:["AI","思想"],hasImage:false,body:"なんか思いついた気がする！みたいなやつを超雑に言語化してなんかのaiに投げて、ぐるぐる会話して根っこを引き摺り出しいい感じの思想に整え、ChatGPT （課金）とCloudcode（課金）に戦わせた後grok（課金）に勝ちを決めてもらい、更に良くした案をもらってまた戦わせて出来た文章がこちらになります"}
];

// 新しい順にする（最新=先頭=中心）
ENTRIES.reverse();

function buildEdges(entries) {
  const edges = [];
  for (let i = 0; i < entries.length; i++)
    for (let j = i + 1; j < entries.length; j++) {
      const shared = entries[i].tags.filter(t => entries[j].tags.includes(t));
      if (shared.length >= 2) edges.push({ from: i, to: j, tags: shared, weight: shared.length });
    }
  return edges;
}

function buildDensity(entries, edges) {
  const d = entries.map((_, i) => edges.filter(e => e.from === i || e.to === i).reduce((a, e) => a + e.weight, 0));
  const mx = Math.max(...d, 1);
  return { density: d, maxDensity: mx };
}

// 全エントリー（自分 + 関心ノード）を結合してグラフ化
const ALL_ENTRIES = [...ENTRIES, ...EXTERNAL];
const ALL_EDGES = buildEdges(ALL_ENTRIES);
const { density: ALL_DENSITY, maxDensity: ALL_MAX_DENSITY } = buildDensity(ALL_ENTRIES, ALL_EDGES);

// 自分のポストのみ
const EDGES = buildEdges(ENTRIES);
const { density: DENSITY, maxDensity: MAX_DENSITY } = buildDensity(ENTRIES, EDGES);

const TL = { thought: "思考", illustration: "絵", note: "雑記" };

const ABOUT = [
  "最もミニマムで、何にでも適応できる、たった一つのシンプルなルールを探している。",
  "わたしは「もの」を見ない。流れを見る。水墨画の筆が紙の上を走るとき、そこにあるのは線ではなく、腕の動き、呼吸、墨の濃淡が織りなす時間の痕跡だ。",
  "キュビズムが好きだ。ひとつのものを多面的に捉えて、それを一枚の平面に折りたたむ。ものの「正面」なんて本当はなくて、触れるたびに違う面が手のひらに当たる。その全部を同時に差し出すのがキュビズムだと思う。",
  "わたしの世界は触覚でできている。視力がとても低いから、輪郭より先に手触りがくる。ざらつき、温度、重さ、抵抗——目を閉じても世界はちゃんとそこにある。むしろ、そのほうが濃い。",
  "浮世絵の線、水墨画の線。あの線は「もの」の縁を描いているのではなく、描く人の手の流れそのものだ。結果ではなく過程。完成ではなく途中。その途中にルールが潜んでいる気がする。",
  "このサイトは、その探索の足跡。日記、イラスト、思考の断片、日常の観察。点と点がつながって、やがて流れが見えてくるかもしれない。",
  "体系立てない。矛盾を恐れない。整合性より、正直さを選ぶ。",
  "手で触れるように、考える。",
];

// ── PulseDot ──────────────────────────────────────────
function PulseDot({ size = 6 }) {
  const [op, setOp] = useState(1);
  useEffect(() => {
    let f, t = 0;
    const go = () => { t += 0.010; setOp(0.18 + Math.sin(t) * 0.32 + 0.32); f = requestAnimationFrame(go); };
    f = requestAnimationFrame(go);
    return () => cancelAnimationFrame(f);
  }, []);
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", backgroundColor:"#2a241c", opacity:op, verticalAlign:"middle", marginLeft:5, marginBottom:2 }} />;
}

// ── PaperTexture ──────────────────────────────────────
function PaperTexture({ width, height }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); c.width = width; c.height = height;
    ctx.fillStyle = "#f0ece7"; ctx.fillRect(0, 0, width, height);
    const rand = mkRand("paper-t");
    for (let i = 0; i < width * height * 0.015; i++) {
      ctx.fillStyle = `rgba(42,36,28,${rand() * 0.032})`;
      ctx.fillRect(rand() * width, rand() * height, rand() > 0.5 ? 2 : 1, 1);
    }
    ctx.strokeStyle = "rgba(42,36,28,0.01)"; ctx.lineWidth = 0.5;
    for (let i = 0; i < 25; i++) {
      ctx.beginPath(); const y = rand() * height;
      ctx.moveTo(0, y); ctx.lineTo(width, y + (rand() - 0.5) * 8); ctx.stroke();
    }
  }, [width, height]);
  return <canvas ref={ref} style={{ position:"absolute", top:0, left:0, width, height, pointerEvents:"none" }} />;
}

// ── SumiArt ───────────────────────────────────────────
function SumiArt({ seed, size = 220 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const s = size * 2; c.width = s; c.height = s;
    ctx.fillStyle = "#f0ece7"; ctx.fillRect(0, 0, s, s);
    const rand = mkRand(seed);
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = `rgba(42,36,28,${rand() * 0.03})`;
      ctx.fillRect(rand() * s, rand() * s, 1, 1);
    }
    for (let i = 0; i < 3; i++) {
      const gx = rand() * s, gy = rand() * s;
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 60 + rand() * s * 0.4);
      grad.addColorStop(0, `rgba(42,36,28,${0.02 + rand() * 0.03})`);
      grad.addColorStop(1, "rgba(42,36,28,0)");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, s, s);
    }
    for (let i = 0; i < 3 + Math.floor(rand() * 5); i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(42,36,28,${0.12 + rand() * 0.45})`;
      ctx.lineWidth = 0.5 + rand() * 4.5; ctx.lineCap = "round";
      let x = rand() * s, y = rand() * s; ctx.moveTo(x, y);
      for (let j = 0; j < 3 + Math.floor(rand() * 4); j++) {
        const a = rand() * Math.PI * 2, l = 30 + rand() * s * 0.35;
        ctx.quadraticCurveTo(x + Math.cos(a + rand()) * l * 0.6, y + Math.sin(a + rand()) * l * 0.6, x + Math.cos(a) * l, y + Math.sin(a) * l);
        x += Math.cos(a) * l; y += Math.sin(a) * l;
      }
      ctx.stroke();
    }
    if (rand() > 0.3) {
      ctx.beginPath();
      const cr = 25 + rand() * s * 0.22;
      const cx = s * 0.3 + rand() * s * 0.4, cy = s * 0.3 + rand() * s * 0.4;
      ctx.arc(cx, cy, cr, rand() * Math.PI * 2, rand() * Math.PI * 2 + Math.PI * (1.3 + rand() * 0.6));
      ctx.strokeStyle = `rgba(42,36,28,${0.15 + rand() * 0.3})`;
      ctx.lineWidth = 1.5 + rand() * 3.5; ctx.lineCap = "round"; ctx.stroke();
    }
  }, [seed, size]);
  return <canvas ref={ref} style={{ width:size, height:size, display:"block", borderRadius:2 }} />;
}

// ── NetworkGraph ──────────────────────────────────────
function NetworkGraph({ entries, edges, density, maxDensity, onSelect, width, height, scrollRef, externalStyle }) {
  const posRef = useRef(null);
  const [tapped, setTapped] = useState(null);
  const [positions, setPositions] = useState([]);
  const [hoveredTitle, setHoveredTitle] = useState(null);
  const [ripples, setRipples] = useState([]);
  const rafRef = useRef(null);

  // 波紋アニメーションループ
  useEffect(() => {
    const tick = () => {
      setRipples(prev => {
        const next = prev
          .map(r => ({ ...r, progress: r.progress + 0.022 }))
          .filter(r => r.progress < 1);
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const scale = 3.2;
  const vw = width * scale, vh = height * scale;

  useEffect(() => {
    posRef.current = computeLayout(vw, vh, entries, edges);
    setPositions(posRef.current);
  }, [vw, vh, entries.length]);

  useEffect(() => {
    if (positions.length && scrollRef?.current) {
      const node = positions[0];
      if (node) {
        scrollRef.current.scrollTo({
          left: Math.max(0, node.x - width / 2),
          top: Math.max(0, node.y - height * 0.35),
          behavior: "instant",
        });
      }
    }
  }, [positions, width, height]);

  if (!positions.length) return null;

  const active = tapped;
  const aEdges = active !== null ? edges.filter(e => e.from === active || e.to === active) : [];
  const conn = new Set();
  aEdges.forEach(e => { conn.add(e.from); conn.add(e.to); });

  const handleTap = (i, entry) => {
    const rid = Date.now();
    setRipples(prev => [...prev, {rid, i, progress: 0}]);
    if (tapped === i) onSelect(entry);
    else setTapped(i);
  };

  return (
    <div style={{ position:"relative", width:vw, height:vh }}>
      <PaperTexture width={vw} height={vh} />
      <svg width={vw} height={vh}
        style={{ position:"relative", display:"block", touchAction:"manipulation" }}
        onClick={e => { if (e.target === e.currentTarget) { setTapped(null); setHoveredTitle(null); } }}>

        {/* Enso circles */}
        {positions.map((pos, i) => {
          const d = density[i] / maxDensity;
          if (d < 0.15) return null;
          const rand = mkRand(`enso-${i}`);
          const r = 25 + d * 70;
          return (
            <g key={`enso-${i}`} opacity={active !== null && active !== i && !conn.has(i) ? 0.01 : 1}
              style={{ transition:"opacity 0.5s" }}>
              <circle cx={pos.x} cy={pos.y} r={r} fill="none" stroke="rgba(42,36,28,0.045)"
                strokeWidth={0.5 + d * 2.5} strokeLinecap="round"
                strokeDasharray={`${r * Math.PI * (1.2 + d * 0.7)} ${r * Math.PI * (0.8 - d * 0.7)}`}
                strokeDashoffset={-r * rand() * Math.PI * 2} />
              {d > 0.5 && (
                <circle cx={pos.x + (rand() - 0.5) * 10} cy={pos.y + (rand() - 0.5) * 10}
                  r={50 + d * 45} fill="none" stroke="rgba(42,36,28,0.025)"
                  strokeWidth={0.4 + d * 1.2} strokeLinecap="round"
                  strokeDasharray={`${(50 + d * 45) * Math.PI * 0.8} ${(50 + d * 45) * Math.PI * 1.2}`}
                  strokeDashoffset={-r * rand() * Math.PI * 2} />
              )}
            </g>
          );
        })}

        {/* Edges */}
        {edges.map((edge, i) => {
          const p1 = positions[edge.from], p2 = positions[edge.to];
          if (!p1 || !p2) return null;
          const hl = active !== null && (edge.from === active || edge.to === active);
          const dim = active !== null && !hl;
          return (
            <path key={`e${i}`} d={inkPath(p1.x, p1.y, p2.x, p2.y, `e${i}`)}
              fill="none" stroke="#2a241c"
              strokeWidth={hl ? (edge.weight > 1 ? 2.2 : 1.4) : 0.7}
              strokeLinecap="round"
              opacity={dim ? 0.015 : hl ? 0.4 : 0.07}
              style={{ transition:"opacity 0.4s" }} />
          );
        })}

        {/* Nodes */}
        {positions.map((pos, i) => {
          const entry = entries[i];
          const isExt = !!entry.isExternal;
          const isA = active === i, isC = conn.has(i);
          const dim = active !== null && !isA && !isC;
          const isFirst = i === 0;
          const isHovered = hoveredTitle === i;

          const d = density[i] / maxDensity;
          const dotR = isFirst ? 3.5 : isA ? 3 : isExt ? 1.2 : 1 + d * 3;
          const dotOpacity = isExt ? (externalStyle === "outline" ? 0 : 0.28) : 1;
          const labelOpacity = isExt ? 0.22 : 1;
          const labelSize = isExt ? 10 : isFirst ? 15 : isA ? 14 : 12.5;

          return (
            <g key={entry.slug || i}
              style={{ cursor:"pointer", transition:"opacity 0.4s" }}
              opacity={dim ? 0.05 : 1}
              onClick={e => {
                e.stopPropagation();
                if (isExt) {
                  const linked = entries.find(en => en.slug === entry.linkedTo);
                  if (linked) onSelect(linked);
                } else {
                  handleTap(i, entry);
                }
              }}
              onMouseEnter={() => setHoveredTitle(i)}
              onMouseLeave={() => setHoveredTitle(null)}>
              <circle cx={pos.x} cy={pos.y} r={40} fill="transparent" />
              {!isExt && (isA || isFirst) && (
                <circle cx={pos.x} cy={pos.y} r={isA ? 18 : 11}
                  fill={`rgba(42,36,28,${isA ? 0.04 : 0.02})`} />
              )}
              {isExt && externalStyle === "outline" && (
                <circle cx={pos.x} cy={pos.y} r={3.5}
                  fill="none" stroke="rgba(42,36,28,0.3)" strokeWidth={0.8}
                  strokeDasharray="1.5 1.5" />
              )}
              {(!isExt || externalStyle === "solid") && (
                <circle cx={pos.x} cy={pos.y} r={dotR}
                  fill={`rgba(42,36,28,${dotOpacity})`} />
              )}
              <text x={pos.x} y={pos.y - (isA || isFirst ? 16 : 11)} textAnchor="middle"
                fontSize={labelSize}
                fontWeight={isFirst || isA ? 700 : 400}
                fill="#2a241c"
                opacity={labelOpacity}
                fontFamily="'Zen Kaku Gothic New', sans-serif"
                letterSpacing="0.04em"
                style={{ userSelect:"none" }}>
                {entry.id}
              </text>
              {(isHovered || isA) && !isFirst && (
                <text x={pos.x} y={pos.y + 22} textAnchor="middle"
                  fontSize={11} fill="#2a241c" opacity={isExt ? 0.25 : 0.35}
                  fontFamily="'Zen Old Mincho', serif" letterSpacing="0.05em"
                  style={{ userSelect:"none", pointerEvents:"none" }}>
                  {entry.title}
                </text>
              )}
              {isFirst && (
                <text x={pos.x} y={pos.y + 22} textAnchor="middle"
                  fontSize={11.5} fill="#2a241c" opacity={0.3}
                  fontFamily="'Zen Old Mincho', serif" letterSpacing="0.06em"
                  style={{ userSelect:"none" }}>
                  {entry.title}
                </text>
              )}
            </g>
          );
        })}

        {/* Active: edge tag labels + hint */}
        {active !== null && positions[active] && (
          <>
            <text x={positions[active].x} y={positions[active].y + (positions[active].y < vh * 0.5 ? 38 : -26)}
              textAnchor="middle" fontSize={9} fill="#2a241c" opacity={0.18}
              fontFamily="'Zen Kaku Gothic New', sans-serif" letterSpacing="0.08em">
              もう一度タップで開く
            </text>
            {aEdges.map((edge, ei) => {
              const o = edge.from === active ? edge.to : edge.from;
              if (!positions[o]) return null;
              const mx = (positions[active].x + positions[o].x) / 2;
              const my = (positions[active].y + positions[o].y) / 2;
              return (
                <text key={`t${ei}`} x={mx} y={my - 6} textAnchor="middle" fontSize={8.5}
                  fill="#2a241c" opacity={0.18} fontFamily="'Zen Old Mincho', serif">
                  {edge.tags.join("　")}
                </text>
              );
            })}
          </>
        )}

        {/* 水面波紋レイヤー */}
        {ripples.map(({rid, i: ri, progress}) => {
          const rpos = positions[ri];
          if (!rpos) return null;
          return (
            <g key={rid} style={{pointerEvents:"none"}}>
              {[0, 0.18, 0.36].map((delay, wi) => {
                const p = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
                if (p <= 0) return null;
                const ep = 1 - Math.pow(1 - p, 2);
                const r = 4 + ep * (55 + wi * 22);
                const op = (1 - p) * (0.28 - wi * 0.08);
                if (op <= 0) return null;
                return <circle key={wi} cx={rpos.x} cy={rpos.y} r={r} fill="none" stroke={`rgba(42,36,28,${op.toFixed(3)})`} strokeWidth={0.7 - wi * 0.15} />;
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────
export default function IchiApp() {
  const [view, setView] = useState("graph");
  const [entry, setEntry] = useState(null);
  const [transition, setTransition] = useState("in");
  const [filter, setFilter] = useState(null);
  const [showExternal, setShowExternal] = useState(false);
  const [externalStyle] = useState("outline");
  const cRef = useRef(null);
  const scrollRef = useRef(null);
  const [dims, setDims] = useState({ w: 380, h: 680, isDesktop: false, totalW: 380 });

  useEffect(() => {
    const m = () => {
      if (cRef.current) {
        const totalW = cRef.current.offsetWidth;
        const isDesktop = totalW >= 768;
        const graphW = isDesktop ? Math.floor(totalW * 0.52) : totalW;
        setDims({ w: graphW, h: Math.min(window.innerHeight, 900), isDesktop, totalW });
      }
    };
    m();
    window.addEventListener("resize", m);
    return () => window.removeEventListener("resize", m);
  }, []);

  const nav = useCallback((v, e = null) => {
    setTransition("out");
    setTimeout(() => { setView(v); setEntry(e); setTransition("in"); }, 220);
  }, []);

  const filteredEntries = filter ? ENTRIES.filter(e => e.type === filter) : ENTRIES;

  const styles = {
    root: {
      fontFamily: "'Zen Old Mincho', 'Shippori Mincho', serif",
      background: "#f0ece7",
      color: "#2a241c",
      minHeight: "100vh",
      WebkitFontSmoothing: "antialiased",
    },
    header: {
      position: "sticky",
      top: 0,
      zIndex: 100,
      padding: "16px 22px 13px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "rgba(240,236,231,0.9)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(42,36,28,0.05)",
    },
    logo: {
      cursor: "pointer",
      fontSize: 21,
      fontWeight: 700,
      letterSpacing: "0.2em",
      userSelect: "none",
      display: "flex",
      alignItems: "center",
      gap: 2,
    },
    tagline: {
      fontSize: 8,
      opacity: 0.2,
      letterSpacing: "0.18em",
      marginTop: 2,
      fontFamily: "'Zen Kaku Gothic New', sans-serif",
    },
    nav: {
      display: "flex",
      gap: 18,
      fontSize: 10,
      opacity: 0.3,
      fontFamily: "'Zen Kaku Gothic New', sans-serif",
    },
    main: {
      opacity: transition === "in" ? 1 : 0,
      transform: transition === "in" ? "translateY(0)" : "translateY(6px)",
      transition: "opacity 0.25s ease, transform 0.25s ease",
      display: dims.isDesktop ? "flex" : "block",
      alignItems: "flex-start",
      minHeight: dims.isDesktop ? `${dims.h}px` : "auto",
    },
  };

  return (
    <div ref={cRef} style={styles.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap'); * { margin:0; padding:0; box-sizing:border-box; } html,body { background:#f0ece7; } ::selection { background:rgba(42,36,28,0.1); } ::-webkit-scrollbar { width:3px; height:3px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(42,36,28,0.12); border-radius:2px; }`}</style>

      <header style={styles.header}>
        <div onClick={() => nav("graph")} style={{ cursor:"pointer" }}>
          <div style={styles.logo}>一<PulseDot /></div>
          <div style={styles.tagline}>手で触れるように、考える。</div>
        </div>
        <nav style={styles.nav}>
          {["list","about"].map(v => (
            <span key={v} onClick={() => nav(v)} style={{
              cursor:"pointer", padding:"5px 0",
              borderBottom: view === v ? "1px solid rgba(42,36,28,0.4)" : "1px solid transparent",
              transition:"border-color 0.2s",
              opacity: view === v ? 0.7 : 0.3,
            }}>{v === "list" ? "一覧" : "about"}</span>
          ))}
        </nav>
      </header>

      <main style={styles.main}>

        {/* ── グラフペイン（デスクトップでは常に左に固定） ── */}
        <div style={{
          width: dims.isDesktop ? dims.w : "100%",
          flexShrink: 0,
          position: dims.isDesktop ? "sticky" : "relative",
          top: dims.isDesktop ? 56 : "auto",
          height: dims.isDesktop ? `${dims.h - 56}px` : "auto",
          display: (!dims.isDesktop && view !== "graph") ? "none" : "block",
          borderRight: dims.isDesktop ? "1px solid rgba(42,36,28,0.05)" : "none",
        }}>
          <div style={{
            display:"flex", gap:8, alignItems:"center",
            padding:"8px 18px 6px",
            borderBottom:"1px solid rgba(42,36,28,0.04)",
          }}>
            <button onClick={() => setShowExternal(v => !v)} style={{
              background:"none", border:"1px solid rgba(42,36,28,0.18)",
              borderRadius:20, padding:"4px 12px",
              fontSize:9.5, cursor:"pointer", color:"#2a241c",
              fontFamily:"'Zen Kaku Gothic New', sans-serif",
              letterSpacing:"0.08em",
              opacity: showExternal ? 0.7 : 0.3,
              transition:"opacity 0.2s",
            }}>
              {showExternal ? "関心を隠す" : "+ 関心を表示"}
            </button>
          </div>
          <div ref={scrollRef} style={{
            width:"100%",
            height: dims.isDesktop ? dims.h - 56 - 38 : dims.h - 56 - 38,
            overflow:"auto",
            WebkitOverflowScrolling:"touch",
            position:"relative",
            cursor:"grab",
          }}
          onMouseDown={e => {
            if (e.button !== 0) return;
            const el = scrollRef.current;
            if (!el) return;
            const startX = e.clientX + el.scrollLeft;
            const startY = e.clientY + el.scrollTop;
            el.style.cursor = "grabbing";
            el.style.userSelect = "none";
            const onMove = ev => {
              el.scrollLeft = startX - ev.clientX;
              el.scrollTop  = startY - ev.clientY;
            };
            const onUp = () => {
              el.style.cursor = "grab";
              el.style.userSelect = "";
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
          >
            <NetworkGraph
              entries={showExternal ? ALL_ENTRIES : ENTRIES}
              edges={showExternal ? ALL_EDGES : EDGES}
              density={showExternal ? ALL_DENSITY : DENSITY}
              maxDensity={showExternal ? ALL_MAX_DENSITY : MAX_DENSITY}
              width={dims.w} height={dims.h - 56}
              onSelect={e => nav("entry", e)}
              scrollRef={scrollRef}
              externalStyle={externalStyle}
            />
          </div>
        </div>

        {/* ── 右ペイン（デスクトップのみ、list/about/entryを表示） ── */}
        {dims.isDesktop && (
          <div style={{
            flex: 1,
            height: `${dims.h - 56}px`,
            overflowY: "auto",
            position: "sticky",
            top: 56,
          }}>
            {view === "graph" && (
              <div style={{ padding:"40px 32px", opacity:0.25, fontSize:11, fontFamily:"'Zen Kaku Gothic New', sans-serif", letterSpacing:"0.14em" }}>
                ノードをタップして開く
              </div>
            )}
            {view === "list" && (
              <div style={{ padding:"20px 32px 80px" }}>
                <div style={{ display:"flex", gap:8, marginBottom:28, marginTop:4 }}>
                  {[null, "thought","note","illustration"].map(f => (
                    <button key={String(f)} onClick={() => setFilter(f)} style={{
                      background:"none", border:"none", cursor:"pointer",
                      fontSize:9.5, padding:"5px 10px",
                      fontFamily:"'Zen Kaku Gothic New', sans-serif",
                      color:"#2a241c",
                      opacity: filter === f ? 0.75 : 0.22,
                      borderBottom: filter === f ? "1px solid rgba(42,36,28,0.4)" : "1px solid transparent",
                      transition:"opacity 0.2s, border-color 0.2s",
                      letterSpacing:"0.08em",
                    }}>
                      {f === null ? "すべて" : TL[f]}
                    </button>
                  ))}
                </div>
                {filteredEntries.map((e) => (
                  <div key={e.slug} onClick={() => nav("entry", e)}
                    style={{
                      cursor:"pointer", padding:"14px 0",
                      borderBottom:"1px solid rgba(42,36,28,0.04)",
                      display:"grid", gridTemplateColumns:"56px 22px 1fr",
                      alignItems:"baseline", gap:10, transition:"opacity 0.15s",
                    }}
                    onMouseEnter={ev => ev.currentTarget.style.opacity = "0.4"}
                    onMouseLeave={ev => ev.currentTarget.style.opacity = "1"}>
                    <span style={{ fontSize:9.5, opacity:0.2, fontVariantNumeric:"tabular-nums", fontFamily:"'Zen Kaku Gothic New', sans-serif", letterSpacing:"0.02em" }}>{e.date}</span>
                    <span style={{ fontSize:8, opacity:0.15, fontFamily:"'Zen Kaku Gothic New', sans-serif" }}>{TL[e.type]}</span>
                    <div>
                      <div style={{ fontSize:13.5, letterSpacing:"0.04em" }}>{e.title}</div>
                      <div style={{ fontSize:10, opacity:0.25, marginTop:4, lineHeight:1.6, letterSpacing:"0.01em" }}>
                        {e.body.slice(0, 48)}{e.body.length > 48 ? "…" : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {view === "about" && (
              <div style={{ padding:"32px 32px 80px", maxWidth:540 }}>
                <h1 style={{ fontSize:15, fontWeight:700, marginBottom:44, letterSpacing:"0.18em", opacity:0.5 }}>「一」について</h1>
                {ABOUT.map((p, i) => {
                  const isLast = i === ABOUT.length - 1;
                  const isSecondLast = i === ABOUT.length - 2;
                  return (
                    <p key={i} style={{
                      fontSize: isLast ? 15 : 12.5,
                      marginBottom: isLast ? 0 : isSecondLast ? 40 : 26,
                      opacity: isLast ? 0.6 : 0.42,
                      fontWeight: isLast ? 700 : 400,
                      lineHeight: isLast ? 1.8 : 2.1,
                      letterSpacing: isLast ? "0.12em" : "0.04em",
                    }}>{p}</p>
                  );
                })}
                <div style={{ marginTop:60, paddingTop:16, borderTop:"1px solid rgba(42,36,28,0.05)", fontSize:9.5, opacity:0.14, fontFamily:"'Zen Kaku Gothic New', sans-serif", letterSpacing:"0.12em" }}>
                  フサノ — 2026
                </div>
              </div>
            )}
            {view === "entry" && entry && (
              <div style={{ padding:"24px 32px 80px", maxWidth:560 }}>
                <div onClick={() => nav("graph")} style={{
                  fontSize:11, opacity:0.55, cursor:"pointer",
                  marginBottom:36, padding:"8px 0",
                  fontFamily:"'Zen Kaku Gothic New', sans-serif",
                  letterSpacing:"0.12em",
                  display:"inline-flex", alignItems:"center", gap:8,
                  transition:"opacity 0.15s",
                  borderBottom:"1px solid rgba(42,36,28,0.15)",
                }}
                  onMouseEnter={ev => ev.currentTarget.style.opacity="1"}
                  onMouseLeave={ev => ev.currentTarget.style.opacity="0.55"}>
                  ← グラフに戻る
                </div>
                <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:24, fontFamily:"'Zen Kaku Gothic New', sans-serif" }}>
                  <span style={{ fontSize:9.5, opacity:0.22, letterSpacing:"0.04em" }}>{entry.date}</span>
                  <span style={{ fontSize:8.5, opacity:0.15, padding:"2px 8px", border:"1px solid rgba(42,36,28,0.1)", borderRadius:12 }}>{TL[entry.type]}</span>
                </div>
                {entry.hasImage && (
                  <div style={{ marginBottom:32, opacity:0.92 }}>
                    <SumiArt seed={entry.id} size={Math.min(dims.totalW * 0.44 - 64, 300)} />
                  </div>
                )}
                <p style={{ fontSize:14, opacity:0.52, marginBottom:36, whiteSpace:"pre-wrap", lineHeight:2.1, letterSpacing:"0.04em" }}>
                  {entry.body}
                </p>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:40 }}>
                  {entry.tags.map(t => (
                    <span key={t} style={{
                      fontSize:8.5, padding:"3px 10px",
                      border:"1px solid rgba(42,36,28,0.08)",
                      borderRadius:14, opacity:0.28,
                      fontFamily:"'Zen Kaku Gothic New', sans-serif",
                      letterSpacing:"0.06em",
                    }}>{t}</span>
                  ))}
                </div>
                {(() => {
                  const idx = ENTRIES.findIndex(e => e.slug === entry.slug);
                  if (idx < 0) return null;
                  const rel = EDGES
                    .filter(e => e.from === idx || e.to === idx)
                    .map(e => ({ entry: ENTRIES[e.from === idx ? e.to : e.from], tags: e.tags }))
                    .slice(0, 4);
                  if (!rel.length) return null;
                  return (
                    <div style={{ borderTop:"1px solid rgba(42,36,28,0.05)", paddingTop:20 }}>
                      <div style={{ fontSize:9, opacity:0.18, marginBottom:14, fontFamily:"'Zen Kaku Gothic New', sans-serif", letterSpacing:"0.14em" }}>つながり</div>
                      {rel.map((r, ri) => (
                        <div key={ri} onClick={() => nav("entry", r.entry)}
                          style={{
                            cursor:"pointer", padding:"12px 0",
                            borderBottom:"1px solid rgba(42,36,28,0.025)",
                            display:"grid", gridTemplateColumns:"52px 1fr auto",
                            alignItems:"baseline", gap:10, transition:"opacity 0.15s",
                          }}
                          onMouseEnter={ev => ev.currentTarget.style.opacity="0.35"}
                          onMouseLeave={ev => ev.currentTarget.style.opacity="1"}>
                          <span style={{ fontSize:9, opacity:0.2, fontFamily:"'Zen Kaku Gothic New', sans-serif" }}>{r.entry.id}</span>
                          <span style={{ fontSize:12.5, letterSpacing:"0.03em" }}>{r.entry.title}</span>
                          <span style={{ fontSize:7.5, opacity:0.15, fontFamily:"'Zen Kaku Gothic New', sans-serif", whiteSpace:"nowrap" }}>{r.tags.join("　")}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div style={{ marginTop:52, paddingTop:16, borderTop:"1px solid rgba(42,36,28,0.04)", fontSize:11, opacity:0.13, fontStyle:"italic", letterSpacing:"0.1em" }}>
                  手で触れるように、考える。
                </div>
              </div>
            )}
          </div>
        )}

        {view === "list" && (!dims.isDesktop) && (
          <div style={{ padding:"20px 22px 80px" }}>
            <div style={{ display:"flex", gap:8, marginBottom:28, marginTop:4 }}>
              {[null, "thought","note","illustration"].map(f => (
                <button key={String(f)} onClick={() => setFilter(f)} style={{
                  background:"none", border:"none", cursor:"pointer",
                  fontSize:9.5, padding:"5px 10px",
                  fontFamily:"'Zen Kaku Gothic New', sans-serif",
                  color:"#2a241c",
                  opacity: filter === f ? 0.75 : 0.22,
                  borderBottom: filter === f ? "1px solid rgba(42,36,28,0.4)" : "1px solid transparent",
                  transition:"opacity 0.2s, border-color 0.2s",
                  letterSpacing:"0.08em",
                }}>
                  {f === null ? "すべて" : TL[f]}
                </button>
              ))}
            </div>

            {filteredEntries.map((e) => (
              <div key={e.slug} onClick={() => nav("entry", e)}
                style={{
                  cursor:"pointer",
                  padding:"14px 0",
                  borderBottom:"1px solid rgba(42,36,28,0.04)",
                  display:"grid",
                  gridTemplateColumns:"56px 22px 1fr",
                  alignItems:"baseline",
                  gap: 10,
                  transition:"opacity 0.15s",
                }}
                onMouseEnter={ev => ev.currentTarget.style.opacity = "0.4"}
                onMouseLeave={ev => ev.currentTarget.style.opacity = "1"}>
                <span style={{ fontSize:9.5, opacity:0.2, fontVariantNumeric:"tabular-nums", fontFamily:"'Zen Kaku Gothic New', sans-serif", letterSpacing:"0.02em" }}>{e.date}</span>
                <span style={{ fontSize:8, opacity:0.15, fontFamily:"'Zen Kaku Gothic New', sans-serif" }}>{TL[e.type]}</span>
                <div>
                  <div style={{ fontSize:13.5, letterSpacing:"0.04em" }}>{e.title}</div>
                  <div style={{ fontSize:10, opacity:0.25, marginTop:4, lineHeight:1.6, letterSpacing:"0.01em" }}>
                    {e.body.slice(0, 48)}{e.body.length > 48 ? "…" : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "about" && (!dims.isDesktop) && (
          <div style={{ padding:"32px 26px 80px", maxWidth:440 }}>
            <h1 style={{ fontSize:15, fontWeight:700, marginBottom:44, letterSpacing:"0.18em", opacity:0.5 }}>
              「一」について
            </h1>
            {ABOUT.map((p, i) => {
              const isLast = i === ABOUT.length - 1;
              const isSecondLast = i === ABOUT.length - 2;
              return (
                <p key={i} style={{
                  fontSize: isLast ? 15 : 12.5,
                  marginBottom: isLast ? 0 : isSecondLast ? 40 : 26,
                  opacity: isLast ? 0.6 : 0.42,
                  fontWeight: isLast ? 700 : 400,
                  lineHeight: isLast ? 1.8 : 2.1,
                  letterSpacing: isLast ? "0.12em" : "0.04em",
                }}>{p}</p>
              );
            })}
            <div style={{ marginTop:60, paddingTop:16, borderTop:"1px solid rgba(42,36,28,0.05)", fontSize:9.5, opacity:0.14, fontFamily:"'Zen Kaku Gothic New', sans-serif", letterSpacing:"0.12em" }}>
              フサノ — 2026
            </div>
          </div>
        )}

        {view === "entry" && entry && (!dims.isDesktop) && (
          <div style={{ padding:"16px 26px 80px", maxWidth:440 }}>
            <div onClick={() => nav("graph")} style={{
              fontSize:11, opacity:0.55, cursor:"pointer",
              marginBottom:36, padding:"8px 0",
              fontFamily:"'Zen Kaku Gothic New', sans-serif",
              letterSpacing:"0.12em",
              display:"inline-flex", alignItems:"center", gap:8,
              transition:"opacity 0.15s",
              borderBottom:"1px solid rgba(42,36,28,0.15)",
            }}
              onMouseEnter={ev => ev.currentTarget.style.opacity="1"}
              onMouseLeave={ev => ev.currentTarget.style.opacity="0.55"}>
              ← グラフに戻る
            </div>

            <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:12, fontFamily:"'Zen Kaku Gothic New', sans-serif" }}>
              <span style={{ fontSize:9.5, opacity:0.22, letterSpacing:"0.04em" }}>{entry.date}</span>
              <span style={{ fontSize:8.5, opacity:0.15, padding:"2px 8px", border:"1px solid rgba(42,36,28,0.1)", borderRadius:12 }}>{TL[entry.type]}</span>
            </div>

            <h2 style={{ fontSize:16, fontWeight:700, marginBottom:24, letterSpacing:"0.06em", lineHeight:1.6, opacity:0.75 }}>
              {entry.title}
            </h2>

            {entry.hasImage && (
              <div style={{ marginBottom:32, opacity:0.92 }}>
                <SumiArt seed={entry.id} size={Math.min(dims.w - 52, 260)} />
              </div>
            )}

            <p style={{ fontSize:13.5, opacity:0.48, marginBottom:36, whiteSpace:"pre-wrap", lineHeight:2.1, letterSpacing:"0.04em" }}>
              {entry.body}
            </p>

            <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:40 }}>
              {entry.tags.map(t => (
                <span key={t} style={{
                  fontSize:8.5, padding:"3px 10px",
                  border:"1px solid rgba(42,36,28,0.08)",
                  borderRadius:14, opacity:0.28,
                  fontFamily:"'Zen Kaku Gothic New', sans-serif",
                  letterSpacing:"0.06em",
                }}>{t}</span>
              ))}
            </div>

            {(() => {
              const idx = ENTRIES.findIndex(e => e.slug === entry.slug);
              if (idx < 0) return null;
              const rel = EDGES
                .filter(e => e.from === idx || e.to === idx)
                .map(e => ({ entry: ENTRIES[e.from === idx ? e.to : e.from], tags: e.tags }))
                .slice(0, 4);
              if (!rel.length) return null;
              return (
                <div style={{ borderTop:"1px solid rgba(42,36,28,0.05)", paddingTop:20 }}>
                  <div style={{ fontSize:9, opacity:0.18, marginBottom:14, fontFamily:"'Zen Kaku Gothic New', sans-serif", letterSpacing:"0.14em" }}>
                    つながり
                  </div>
                  {rel.map((r, ri) => (
                    <div key={ri} onClick={() => nav("entry", r.entry)}
                      style={{
                        cursor:"pointer", padding:"12px 0",
                        borderBottom:"1px solid rgba(42,36,28,0.025)",
                        display:"grid", gridTemplateColumns:"52px 1fr auto",
                        alignItems:"baseline", gap:10,
                        transition:"opacity 0.15s",
                      }}
                      onMouseEnter={ev => ev.currentTarget.style.opacity="0.35"}
                      onMouseLeave={ev => ev.currentTarget.style.opacity="1"}>
                      <span style={{ fontSize:9, opacity:0.2, fontFamily:"'Zen Kaku Gothic New', sans-serif" }}>{r.entry.id}</span>
                      <span style={{ fontSize:12.5, letterSpacing:"0.03em" }}>{r.entry.title}</span>
                      <span style={{ fontSize:7.5, opacity:0.15, fontFamily:"'Zen Kaku Gothic New', sans-serif", whiteSpace:"nowrap" }}>{r.tags.join("　")}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div style={{ marginTop:52, paddingTop:16, borderTop:"1px solid rgba(42,36,28,0.04)", fontSize:11, opacity:0.13, fontStyle:"italic", letterSpacing:"0.1em" }}>
              手で触れるように、考える。
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
