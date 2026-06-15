import { getDb, saveDb } from './connection.js';
import { initSchema } from './schema.js';

interface Comp {
  text: string; pinyin: string; role: string;
}
interface SentenceSeed {
  id: string; structure_id: string; english: string; difficulty: number;
  components: Comp[];
}
interface StructureSeed {
  id: string; name_zh: string; name_en: string; difficulty: number;
  template: string; description_zh: string;
}

const structures: StructureSeed[] = [
  { id:'sv', name_zh:'主+动', name_en:'S + V', difficulty:1, template:'S + V', description_zh:'最基本的陈述结构，主语后直接加动词。' },
  { id:'svo', name_zh:'主+动+宾', name_en:'S + V + O', difficulty:1, template:'S + V + O', description_zh:'最常见的主谓宾结构，语序固定为施事—动作—受事。' },
  { id:'s-adj', name_zh:'主+形', name_en:'S + Adj', difficulty:1, template:'S + Adv + Adj', description_zh:'形容词作谓语，通常需要副词修饰（如"很"），不带"是"。' },
  { id:'s-shi-n', name_zh:'主+是+宾', name_en:'S + 是 + N', difficulty:1, template:'S + 是 + N', description_zh:'"是"字句表判断或归类。' },
  { id:'s-you-n', name_zh:'主+有+宾', name_en:'S + 有 + N', difficulty:1, template:'S + 有 + N', description_zh:'"有"字句表领有或存在。' },
  { id:'s-time-vo', name_zh:'主+时+动+宾', name_en:'S + Time + V + O', difficulty:2, template:'S + Time + V + O', description_zh:'时间状语位于主语之后、动词之前。' },
  { id:'s-zai-loc-vo', name_zh:'主+在+地+动+宾', name_en:'S + 在 + Loc + V + O', difficulty:2, template:'S + 在 + Loc + V + O', description_zh:'地点状语由"在"引导，置于动词之前。' },
  { id:'s-adv-adj', name_zh:'主+副+形', name_en:'S + Adv + Adj', difficulty:2, template:'S + Adv + Adj', description_zh:'程度副词修饰形容词，副词在形容词之前。' },
  { id:'s-v-de-comp', name_zh:'主+动+得+补', name_en:'S + V + 得 + Comp', difficulty:2, template:'S + V + 得 + Comp', description_zh:'状态补语由"得"引导，置于动词之后。' },
  { id:'s-gei-o-v', name_zh:'主+给+宾+动', name_en:'S + 给 + O + V', difficulty:2, template:'S + 给 + O + V', description_zh:'"给"引导动作的受益者，置于动词之前。' },
  { id:'s-v-le-o', name_zh:'主+动+了+宾', name_en:'S + V + 了 + O', difficulty:3, template:'S + V + 了 + O', description_zh:'动态助词"了"紧跟动词，表示动作完成。' },
  { id:'s-zhengzai-vo', name_zh:'主+正在+动+宾', name_en:'S + 正在 + V + O', difficulty:3, template:'S + 正在 + V + O', description_zh:'"正在"置于动词之前表示进行。' },
  { id:'s-v-guo-o', name_zh:'主+动+过+宾', name_en:'S + V + 过 + O', difficulty:3, template:'S + V + 过 + O', description_zh:'动态助词"过"紧跟动词，表示曾有的经历。' },
  { id:'s-cong-dao-v', name_zh:'主+从+起+到+终+动', name_en:'S + 从 + Start + 到 + End + V', difficulty:3, template:'S + 从 + Start + 到 + End + V', description_zh:'"从…到…"框定范围，整体在动词之前。' },
  { id:'serial-verbs', name_zh:'连动句', name_en:'Serial Verbs', difficulty:3, template:'S + V1 + O1 + V2 + O2', description_zh:'两个动词短语共用一个主语，表先后或目的关系。' },
  { id:'ba-basic', name_zh:'把字句（基础）', name_en:'把-Construction (Basic)', difficulty:4, template:'S + 把 + O + V + Result', description_zh:'汉语特有处置式。主语通过动作对宾语进行处置并产生结果。语序严格：主语→把→宾语→动词→结果。' },
  { id:'ba-comp', name_zh:'把字句（带补语）', name_en:'把-Construction (with Comp)', difficulty:4, template:'S + 把 + O + V + 得 + Comp', description_zh:'把字句动词后带"得"字补语，描述处置达到的状态。' },
  { id:'bei-agent', name_zh:'被字句（带施事）', name_en:'被-Construction (with Agent)', difficulty:4, template:'O(Patient) + 被 + S(Agent) + V + Result', description_zh:'被动结构。受事主语在前，施事由"被"引导在后。语序与主动句相反。' },
  { id:'bei-no-agent', name_zh:'被字句（省施事）', name_en:'被-Construction (no Agent)', difficulty:4, template:'O + 被 + V + Result', description_zh:'施事不详或无需提及时省略，"被"直接接动词。' },
  { id:'topic-comment', name_zh:'话题句', name_en:'Topic-Comment', difficulty:4, template:'Topic + S + V', description_zh:'话题前置句首，是汉语信息结构的核心特征。' },
  { id:'yi-jiu', name_zh:'一…就…', name_en:'一…就…', difficulty:5, template:'S + 一 + V1 + 就 + V2', description_zh:'连接两个紧密相继的事件，语序固定不可调换。' },
  { id:'bi-structure', name_zh:'比字句', name_en:'比-Comparison', difficulty:5, template:'A + 比 + B + Adj', description_zh:'比较句。形容词前不能加"很"等程度副词。' },
  { id:'shi-de', name_zh:'是…的（强调）', name_en:'是…的 Emphasis', difficulty:5, template:'S + 是 + Info + V + 的', description_zh:'强调已发生事件的时间、地点、方式等信息。' },
  { id:'lian-dou', name_zh:'连…都/也…', name_en:'连…都/也', difficulty:5, template:'连 + O + 都/也 + V', description_zh:'表示极端情况，意为"甚至…也…"。' },
  { id:'ruguo-jiu', name_zh:'如果…就…', name_en:'如果…就…', difficulty:5, template:'如果 + Cond + S + 就 + Result', description_zh:'条件复句，条件从句在前，结果主句在后。' },
];

const sentences: SentenceSeed[] = [
  // ===== L1: SV (5句) =====
  { id:'sv-01', structure_id:'sv', english:'He laughed.', difficulty:1, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'笑了',pinyin:'xiào le',role:'V'}] },
  { id:'sv-02', structure_id:'sv', english:'The baby is sleeping.', difficulty:1, components:[
    {text:'宝宝',pinyin:'bǎobao',role:'S'},{text:'睡了',pinyin:'shuì le',role:'V'}] },
  { id:'sv-03', structure_id:'sv', english:'The bird flew away.', difficulty:1, components:[
    {text:'小鸟',pinyin:'xiǎoniǎo',role:'S'},{text:'飞了',pinyin:'fēi le',role:'V'}] },
  { id:'sv-04', structure_id:'sv', english:'The sun has set.', difficulty:1, components:[
    {text:'太阳',pinyin:'tàiyáng',role:'S'},{text:'落山了',pinyin:'luòshān le',role:'V'}] },
  { id:'sv-05', structure_id:'sv', english:'The guests have arrived.', difficulty:1, components:[
    {text:'客人',pinyin:'kèrén',role:'S'},{text:'来了',pinyin:'lái le',role:'V'}] },
  // ===== L1: SVO (5句) =====
  { id:'svo-01', structure_id:'svo', english:'I eat apples.', difficulty:1, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'吃',pinyin:'chī',role:'V'},{text:'苹果',pinyin:'píngguǒ',role:'O'}] },
  { id:'svo-02', structure_id:'svo', english:'She reads books.', difficulty:1, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'看',pinyin:'kàn',role:'V'},{text:'书',pinyin:'shū',role:'O'}] },
  { id:'svo-03', structure_id:'svo', english:'Mom cooks dinner.', difficulty:1, components:[
    {text:'妈妈',pinyin:'māma',role:'S'},{text:'做',pinyin:'zuò',role:'V'},{text:'晚饭',pinyin:'wǎnfàn',role:'O'}] },
  { id:'svo-04', structure_id:'svo', english:'He kicks a ball.', difficulty:1, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'踢',pinyin:'tī',role:'V'},{text:'足球',pinyin:'zúqiú',role:'O'}] },
  { id:'svo-05', structure_id:'svo', english:'We learn Chinese.', difficulty:1, components:[
    {text:'我们',pinyin:'wǒmen',role:'S'},{text:'学',pinyin:'xué',role:'V'},{text:'中文',pinyin:'Zhōngwén',role:'O'}] },
  // ===== L1: S+Adj (5句) =====
  { id:'s-adj-01', structure_id:'s-adj', english:'The weather is very hot.', difficulty:1, components:[
    {text:'天气',pinyin:'tiānqì',role:'S'},{text:'很',pinyin:'hěn',role:'Adv'},{text:'热',pinyin:'rè',role:'Adj'}] },
  { id:'s-adj-02', structure_id:'s-adj', english:'This flower is beautiful.', difficulty:1, components:[
    {text:'这朵花',pinyin:'zhè duǒ huā',role:'S'},{text:'很',pinyin:'hěn',role:'Adv'},{text:'漂亮',pinyin:'piàoliang',role:'Adj'}] },
  { id:'s-adj-03', structure_id:'s-adj', english:'This apple is sweet.', difficulty:1, components:[
    {text:'这个苹果',pinyin:'zhège píngguǒ',role:'S'},{text:'特别',pinyin:'tèbié',role:'Adv'},{text:'甜',pinyin:'tián',role:'Adj'}] },
  { id:'s-adj-04', structure_id:'s-adj', english:'The room is very clean.', difficulty:1, components:[
    {text:'房间',pinyin:'fángjiān',role:'S'},{text:'非常',pinyin:'fēicháng',role:'Adv'},{text:'干净',pinyin:'gānjìng',role:'Adj'}] },
  { id:'s-adj-05', structure_id:'s-adj', english:'He is very tall.', difficulty:1, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'很',pinyin:'hěn',role:'Adv'},{text:'高',pinyin:'gāo',role:'Adj'}] },
  // ===== L1: S+是+N (5句) =====
  { id:'s-shi-n-01', structure_id:'s-shi-n', english:'I am a student.', difficulty:1, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'是',pinyin:'shì',role:'是'},{text:'学生',pinyin:'xuésheng',role:'N'}] },
  { id:'s-shi-n-02', structure_id:'s-shi-n', english:'She is a teacher.', difficulty:1, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'是',pinyin:'shì',role:'是'},{text:'老师',pinyin:'lǎoshī',role:'N'}] },
  { id:'s-shi-n-03', structure_id:'s-shi-n', english:'This is my book.', difficulty:1, components:[
    {text:'这',pinyin:'zhè',role:'S'},{text:'是',pinyin:'shì',role:'是'},{text:'我的书',pinyin:'wǒ de shū',role:'N'}] },
  { id:'s-shi-n-04', structure_id:'s-shi-n', english:'He is a doctor.', difficulty:1, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'是',pinyin:'shì',role:'是'},{text:'医生',pinyin:'yīshēng',role:'N'}] },
  { id:'s-shi-n-05', structure_id:'s-shi-n', english:'Beijing is the capital.', difficulty:1, components:[
    {text:'北京',pinyin:'Běijīng',role:'S'},{text:'是',pinyin:'shì',role:'是'},{text:'首都',pinyin:'shǒudū',role:'N'}] },
  // ===== L1: S+有+N (5句) =====
  { id:'s-you-n-01', structure_id:'s-you-n', english:'I have a book.', difficulty:1, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'有',pinyin:'yǒu',role:'有'},{text:'一本书',pinyin:'yī běn shū',role:'N'}] },
  { id:'s-you-n-02', structure_id:'s-you-n', english:'She has a cat.', difficulty:1, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'有',pinyin:'yǒu',role:'有'},{text:'一只猫',pinyin:'yī zhī māo',role:'N'}] },
  { id:'s-you-n-03', structure_id:'s-you-n', english:'There are many people here.', difficulty:1, components:[
    {text:'这里',pinyin:'zhèlǐ',role:'S'},{text:'有',pinyin:'yǒu',role:'有'},{text:'很多人',pinyin:'hěn duō rén',role:'N'}] },
  { id:'s-you-n-04', structure_id:'s-you-n', english:'He has two brothers.', difficulty:1, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'有',pinyin:'yǒu',role:'有'},{text:'两个哥哥',pinyin:'liǎng ge gēge',role:'N'}] },
  { id:'s-you-n-05', structure_id:'s-you-n', english:'There is a tree outside.', difficulty:1, components:[
    {text:'外面',pinyin:'wàimiàn',role:'S'},{text:'有',pinyin:'yǒu',role:'有'},{text:'一棵树',pinyin:'yī kē shù',role:'N'}] },

  // ===== L2: S+Time+VO (5句) =====
  { id:'s-time-vo-01', structure_id:'s-time-vo', english:'I will go to Beijing tomorrow.', difficulty:2, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'明天',pinyin:'míngtiān',role:'Time'},{text:'去',pinyin:'qù',role:'V'},{text:'北京',pinyin:'Běijīng',role:'O'}] },
  { id:'s-time-vo-02', structure_id:'s-time-vo', english:'He goes to work at 8 every day.', difficulty:2, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'每天八点',pinyin:'měitiān bā diǎn',role:'Time'},{text:'去',pinyin:'qù',role:'V'},{text:'上班',pinyin:'shàngbān',role:'O'}] },
  { id:'s-time-vo-03', structure_id:'s-time-vo', english:'We have a test next week.', difficulty:2, components:[
    {text:'我们',pinyin:'wǒmen',role:'S'},{text:'下星期',pinyin:'xià xīngqī',role:'Time'},{text:'有',pinyin:'yǒu',role:'V'},{text:'考试',pinyin:'kǎoshì',role:'O'}] },
  { id:'s-time-vo-04', structure_id:'s-time-vo', english:'She went home last night.', difficulty:2, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'昨天晚上',pinyin:'zuótiān wǎnshang',role:'Time'},{text:'回',pinyin:'huí',role:'V'},{text:'家了',pinyin:'jiā le',role:'O'}] },
  { id:'s-time-vo-05', structure_id:'s-time-vo', english:'I do homework at 3 PM.', difficulty:2, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'下午三点',pinyin:'xiàwǔ sān diǎn',role:'Time'},{text:'做',pinyin:'zuò',role:'V'},{text:'作业',pinyin:'zuòyè',role:'O'}] },
  // ===== L2: S+在+Loc+VO (5句) =====
  { id:'s-zai-loc-vo-01', structure_id:'s-zai-loc-vo', english:'I read at the library.', difficulty:2, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'在',pinyin:'zài',role:'在'},{text:'图书馆',pinyin:'túshūguǎn',role:'Loc'},{text:'看',pinyin:'kàn',role:'V'},{text:'书',pinyin:'shū',role:'O'}] },
  { id:'s-zai-loc-vo-02', structure_id:'s-zai-loc-vo', english:'He eats at the cafeteria.', difficulty:2, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'在',pinyin:'zài',role:'在'},{text:'食堂',pinyin:'shítáng',role:'Loc'},{text:'吃',pinyin:'chī',role:'V'},{text:'饭',pinyin:'fàn',role:'O'}] },
  { id:'s-zai-loc-vo-03', structure_id:'s-zai-loc-vo', english:'She shops at the supermarket.', difficulty:2, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'在',pinyin:'zài',role:'在'},{text:'超市',pinyin:'chāoshì',role:'Loc'},{text:'买',pinyin:'mǎi',role:'V'},{text:'东西',pinyin:'dōngxi',role:'O'}] },
  { id:'s-zai-loc-vo-04', structure_id:'s-zai-loc-vo', english:'We exercise at the park.', difficulty:2, components:[
    {text:'我们',pinyin:'wǒmen',role:'S'},{text:'在',pinyin:'zài',role:'在'},{text:'公园',pinyin:'gōngyuán',role:'Loc'},{text:'跑步',pinyin:'pǎobù',role:'V+O'}] },
  { id:'s-zai-loc-vo-05', structure_id:'s-zai-loc-vo', english:'Students study in the classroom.', difficulty:2, components:[
    {text:'学生',pinyin:'xuésheng',role:'S'},{text:'在',pinyin:'zài',role:'在'},{text:'教室',pinyin:'jiàoshì',role:'Loc'},{text:'学习',pinyin:'xuéxí',role:'V+O'}] },
  // ===== L2: S+Adv+Adj (5句) =====
  { id:'s-adv-adj-01', structure_id:'s-adv-adj', english:'He is very smart.', difficulty:2, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'非常',pinyin:'fēicháng',role:'Adv'},{text:'聪明',pinyin:'cōngmíng',role:'Adj'}] },
  { id:'s-adv-adj-02', structure_id:'s-adv-adj', english:'She is especially hardworking.', difficulty:2, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'特别',pinyin:'tèbié',role:'Adv'},{text:'努力',pinyin:'nǔlì',role:'Adj'}] },
  { id:'s-adv-adj-03', structure_id:'s-adv-adj', english:'This question is quite difficult.', difficulty:2, components:[
    {text:'这个问题',pinyin:'zhège wèntí',role:'S'},{text:'比较',pinyin:'bǐjiào',role:'Adv'},{text:'难',pinyin:'nán',role:'Adj'}] },
  { id:'s-adv-adj-04', structure_id:'s-adv-adj', english:'The movie is really good.', difficulty:2, components:[
    {text:'这部电影',pinyin:'zhè bù diànyǐng',role:'S'},{text:'真',pinyin:'zhēn',role:'Adv'},{text:'好看',pinyin:'hǎokàn',role:'Adj'}] },
  { id:'s-adv-adj-05', structure_id:'s-adv-adj', english:'Grandpa is quite old.', difficulty:2, components:[
    {text:'爷爷',pinyin:'yéye',role:'S'},{text:'很',pinyin:'hěn',role:'Adv'},{text:'老了',pinyin:'lǎo le',role:'Adj'}] },
  // ===== L2: S+V+得+Comp (5句) =====
  { id:'s-v-de-comp-01', structure_id:'s-v-de-comp', english:'He runs very fast.', difficulty:2, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'跑',pinyin:'pǎo',role:'V'},{text:'得',pinyin:'de',role:'得'},{text:'很快',pinyin:'hěn kuài',role:'Comp'}] },
  { id:'s-v-de-comp-02', structure_id:'s-v-de-comp', english:'She sings beautifully.', difficulty:2, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'唱',pinyin:'chàng',role:'V'},{text:'得',pinyin:'de',role:'得'},{text:'很好听',pinyin:'hěn hǎotīng',role:'Comp'}] },
  { id:'s-v-de-comp-03', structure_id:'s-v-de-comp', english:'He writes very neatly.', difficulty:2, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'写',pinyin:'xiě',role:'V'},{text:'得',pinyin:'de',role:'得'},{text:'很整齐',pinyin:'hěn zhěngqí',role:'Comp'}] },
  { id:'s-v-de-comp-04', structure_id:'s-v-de-comp', english:'She dances very well.', difficulty:2, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'跳舞',pinyin:'tiàowǔ',role:'V'},{text:'跳得',pinyin:'tiào de',role:'得'},{text:'很好',pinyin:'hěn hǎo',role:'Comp'}] },
  { id:'s-v-de-comp-05', structure_id:'s-v-de-comp', english:'He eats very quickly.', difficulty:2, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'吃',pinyin:'chī',role:'V'},{text:'得',pinyin:'de',role:'得'},{text:'太快了',pinyin:'tài kuài le',role:'Comp'}] },
  // ===== L2: S+给+O+V (5句) =====
  { id:'s-gei-o-v-01', structure_id:'s-gei-o-v', english:'I call mom.', difficulty:2, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'给',pinyin:'gěi',role:'给'},{text:'妈妈',pinyin:'māma',role:'O'},{text:'打电话',pinyin:'dǎ diànhuà',role:'V'}] },
  { id:'s-gei-o-v-02', structure_id:'s-gei-o-v', english:'He sends a gift to his friend.', difficulty:2, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'给',pinyin:'gěi',role:'给'},{text:'朋友',pinyin:'péngyou',role:'O'},{text:'送礼物',pinyin:'sòng lǐwù',role:'V'}] },
  { id:'s-gei-o-v-03', structure_id:'s-gei-o-v', english:'Teacher tells us a story.', difficulty:2, components:[
    {text:'老师',pinyin:'lǎoshī',role:'S'},{text:'给',pinyin:'gěi',role:'给'},{text:'我们',pinyin:'wǒmen',role:'O'},{text:'讲故事',pinyin:'jiǎng gùshi',role:'V'}] },
  { id:'s-gei-o-v-04', structure_id:'s-gei-o-v', english:'She opens the door for the guest.', difficulty:2, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'给',pinyin:'gěi',role:'给'},{text:'客人',pinyin:'kèrén',role:'O'},{text:'开门',pinyin:'kāimén',role:'V'}] },
  { id:'s-gei-o-v-05', structure_id:'s-gei-o-v', english:'I buy a gift for dad.', difficulty:2, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'给',pinyin:'gěi',role:'给'},{text:'爸爸',pinyin:'bàba',role:'O'},{text:'买礼物',pinyin:'mǎi lǐwù',role:'V'}] },

  // ===== L3: S+V+了+O (5句) =====
  { id:'s-v-le-o-01', structure_id:'s-v-le-o', english:'I ate.', difficulty:3, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'吃',pinyin:'chī',role:'V'},{text:'了',pinyin:'le',role:'了'},{text:'饭',pinyin:'fàn',role:'O'}] },
  { id:'s-v-le-o-02', structure_id:'s-v-le-o', english:'He drank water.', difficulty:3, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'喝',pinyin:'hē',role:'V'},{text:'了',pinyin:'le',role:'了'},{text:'水',pinyin:'shuǐ',role:'O'}] },
  { id:'s-v-le-o-03', structure_id:'s-v-le-o', english:'She bought a new dress.', difficulty:3, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'买',pinyin:'mǎi',role:'V'},{text:'了',pinyin:'le',role:'了'},{text:'新衣服',pinyin:'xīn yīfu',role:'O'}] },
  { id:'s-v-le-o-04', structure_id:'s-v-le-o', english:'I finished my homework.', difficulty:3, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'写完',pinyin:'xiě wán',role:'V'},{text:'了',pinyin:'le',role:'了'},{text:'作业',pinyin:'zuòyè',role:'O'}] },
  { id:'s-v-le-o-05', structure_id:'s-v-le-o', english:'He read a book.', difficulty:3, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'看',pinyin:'kàn',role:'V'},{text:'了',pinyin:'le',role:'了'},{text:'一本书',pinyin:'yī běn shū',role:'O'}] },
  // ===== L3: S+正在+VO (5句) =====
  { id:'s-zhengzai-vo-01', structure_id:'s-zhengzai-vo', english:'He is watching TV.', difficulty:3, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'正在',pinyin:'zhèngzài',role:'正在'},{text:'看',pinyin:'kàn',role:'V'},{text:'电视',pinyin:'diànshì',role:'O'}] },
  { id:'s-zhengzai-vo-02', structure_id:'s-zhengzai-vo', english:'Mom is cooking.', difficulty:3, components:[
    {text:'妈妈',pinyin:'māma',role:'S'},{text:'正在',pinyin:'zhèngzài',role:'正在'},{text:'做',pinyin:'zuò',role:'V'},{text:'饭',pinyin:'fàn',role:'O'}] },
  { id:'s-zhengzai-vo-03', structure_id:'s-zhengzai-vo', english:'Students are having class.', difficulty:3, components:[
    {text:'学生',pinyin:'xuésheng',role:'S'},{text:'正在',pinyin:'zhèngzài',role:'正在'},{text:'上',pinyin:'shàng',role:'V'},{text:'课',pinyin:'kè',role:'O'}] },
  { id:'s-zhengzai-vo-04', structure_id:'s-zhengzai-vo', english:'He is playing games.', difficulty:3, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'正在',pinyin:'zhèngzài',role:'正在'},{text:'打',pinyin:'dǎ',role:'V'},{text:'游戏',pinyin:'yóuxì',role:'O'}] },
  { id:'s-zhengzai-vo-05', structure_id:'s-zhengzai-vo', english:'She is listening to music.', difficulty:3, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'正在',pinyin:'zhèngzài',role:'正在'},{text:'听',pinyin:'tīng',role:'V'},{text:'音乐',pinyin:'yīnyuè',role:'O'}] },
  // ===== L3: S+V+过+O (5句) =====
  { id:'s-v-guo-o-01', structure_id:'s-v-guo-o', english:'I have been to Beijing.', difficulty:3, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'去',pinyin:'qù',role:'V'},{text:'过',pinyin:'guo',role:'过'},{text:'北京',pinyin:'Běijīng',role:'O'}] },
  { id:'s-v-guo-o-02', structure_id:'s-v-guo-o', english:'She has eaten Peking duck.', difficulty:3, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'吃',pinyin:'chī',role:'V'},{text:'过',pinyin:'guo',role:'过'},{text:'北京烤鸭',pinyin:'Běijīng kǎoyā',role:'O'}] },
  { id:'s-v-guo-o-03', structure_id:'s-v-guo-o', english:'He has seen this movie.', difficulty:3, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'看',pinyin:'kàn',role:'V'},{text:'过',pinyin:'guo',role:'过'},{text:'这部电影',pinyin:'zhè bù diànyǐng',role:'O'}] },
  { id:'s-v-guo-o-04', structure_id:'s-v-guo-o', english:'I have been to Japan.', difficulty:3, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'去',pinyin:'qù',role:'V'},{text:'过',pinyin:'guo',role:'过'},{text:'日本',pinyin:'Rìběn',role:'O'}] },
  { id:'s-v-guo-o-05', structure_id:'s-v-guo-o', english:'We have learned this text.', difficulty:3, components:[
    {text:'我们',pinyin:'wǒmen',role:'S'},{text:'学',pinyin:'xué',role:'V'},{text:'过',pinyin:'guo',role:'过'},{text:'这篇课文',pinyin:'zhè piān kèwén',role:'O'}] },
  // ===== L3: S+从+Start+到+End+V (5句) =====
  { id:'s-cong-dao-v-01', structure_id:'s-cong-dao-v', english:'I walk from home to school.', difficulty:3, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'从',pinyin:'cóng',role:'从'},{text:'家',pinyin:'jiā',role:'Start'},{text:'到',pinyin:'dào',role:'到'},{text:'学校',pinyin:'xuéxiào',role:'End'},{text:'走路',pinyin:'zǒulù',role:'V'}] },
  { id:'s-cong-dao-v-02', structure_id:'s-cong-dao-v', english:'He works from morning to night.', difficulty:3, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'从',pinyin:'cóng',role:'从'},{text:'早上',pinyin:'zǎoshang',role:'Start'},{text:'到',pinyin:'dào',role:'到'},{text:'晚上',pinyin:'wǎnshang',role:'End'},{text:'工作',pinyin:'gōngzuò',role:'V'}] },
  { id:'s-cong-dao-v-03', structure_id:'s-cong-dao-v', english:'She came from the US to China.', difficulty:3, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'从',pinyin:'cóng',role:'从'},{text:'美国',pinyin:'Měiguó',role:'Start'},{text:'到',pinyin:'dào',role:'到'},{text:'中国',pinyin:'Zhōngguó',role:'End'},{text:'来了',pinyin:'lái le',role:'V'}] },
  { id:'s-cong-dao-v-04', structure_id:'s-cong-dao-v', english:'The book goes from easy to hard.', difficulty:3, components:[
    {text:'这本书',pinyin:'zhè běn shū',role:'S'},{text:'从',pinyin:'cóng',role:'从'},{text:'简单',pinyin:'jiǎndān',role:'Start'},{text:'到',pinyin:'dào',role:'到'},{text:'复杂',pinyin:'fùzá',role:'End'},{text:'越来越难',pinyin:'yuèláiyuènán',role:'V'}] },
  { id:'s-cong-dao-v-05', structure_id:'s-cong-dao-v', english:'I walk from the subway to the office.', difficulty:3, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'从',pinyin:'cóng',role:'从'},{text:'地铁站',pinyin:'dìtiězhàn',role:'Start'},{text:'到',pinyin:'dào',role:'到'},{text:'办公室',pinyin:'bàngōngshì',role:'End'},{text:'走',pinyin:'zǒu',role:'V'}] },
  // ===== L3: Serial Verbs (5句) =====
  { id:'serial-verbs-01', structure_id:'serial-verbs', english:'I go to the library to read.', difficulty:3, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'去',pinyin:'qù',role:'V1'},{text:'图书馆',pinyin:'túshūguǎn',role:'O1'},{text:'看书',pinyin:'kàn shū',role:'V2+O2'}] },
  { id:'serial-verbs-02', structure_id:'serial-verbs', english:'He goes to the store to buy things.', difficulty:3, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'去',pinyin:'qù',role:'V1'},{text:'商店',pinyin:'shāngdiàn',role:'O1'},{text:'买东西',pinyin:'mǎi dōngxi',role:'V2+O2'}] },
  { id:'serial-verbs-03', structure_id:'serial-verbs', english:'She comes to China to learn Chinese.', difficulty:3, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'来',pinyin:'lái',role:'V1'},{text:'中国',pinyin:'Zhōngguó',role:'O1'},{text:'学中文',pinyin:'xué Zhōngwén',role:'V2+O2'}] },
  { id:'serial-verbs-04', structure_id:'serial-verbs', english:'I use a pen to write characters.', difficulty:3, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'用',pinyin:'yòng',role:'V1'},{text:'笔',pinyin:'bǐ',role:'O1'},{text:'写字',pinyin:'xiě zì',role:'V2+O2'}] },
  { id:'serial-verbs-05', structure_id:'serial-verbs', english:'He takes the bus to school.', difficulty:3, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'坐',pinyin:'zuò',role:'V1'},{text:'公交车',pinyin:'gōngjiāochē',role:'O1'},{text:'去学校',pinyin:'qù xuéxiào',role:'V2+O2'}] },

  // ===== L4: 把字句基础 (5句) =====
  { id:'ba-basic-01', structure_id:'ba-basic', english:'I finished reading the book.', difficulty:4, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'把',pinyin:'bǎ',role:'把'},{text:'书',pinyin:'shū',role:'O'},{text:'看',pinyin:'kàn',role:'V'},{text:'完了',pinyin:'wán le',role:'Result'}] },
  { id:'ba-basic-02', structure_id:'ba-basic', english:'Mom washed the clothes clean.', difficulty:4, components:[
    {text:'妈妈',pinyin:'māma',role:'S'},{text:'把',pinyin:'bǎ',role:'把'},{text:'衣服',pinyin:'yīfu',role:'O'},{text:'洗',pinyin:'xǐ',role:'V'},{text:'干净了',pinyin:'gānjìng le',role:'Result'}] },
  { id:'ba-basic-03', structure_id:'ba-basic', english:'He drank all the water.', difficulty:4, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'把',pinyin:'bǎ',role:'把'},{text:'水',pinyin:'shuǐ',role:'O'},{text:'喝',pinyin:'hē',role:'V'},{text:'完了',pinyin:'wán le',role:'Result'}] },
  { id:'ba-basic-04', structure_id:'ba-basic', english:'I threw away the trash.', difficulty:4, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'把',pinyin:'bǎ',role:'把'},{text:'垃圾',pinyin:'lājī',role:'O'},{text:'扔',pinyin:'rēng',role:'V'},{text:'掉了',pinyin:'diào le',role:'Result'}] },
  { id:'ba-basic-05', structure_id:'ba-basic', english:'The teacher wrote the characters on the blackboard.', difficulty:4, components:[
    {text:'老师',pinyin:'lǎoshī',role:'S'},{text:'把',pinyin:'bǎ',role:'把'},{text:'字',pinyin:'zì',role:'O'},{text:'写',pinyin:'xiě',role:'V'},{text:'在黑板上',pinyin:'zài hēibǎn shàng',role:'Result'}] },
  // ===== L4: 把字句带补语 (5句) =====
  { id:'ba-comp-01', structure_id:'ba-comp', english:'He cleaned the room very clean.', difficulty:4, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'把',pinyin:'bǎ',role:'把'},{text:'房间',pinyin:'fángjiān',role:'O'},{text:'打扫',pinyin:'dǎsǎo',role:'V'},{text:'得',pinyin:'de',role:'得'},{text:'很干净',pinyin:'hěn gānjìng',role:'Comp'}] },
  { id:'ba-comp-02', structure_id:'ba-comp', english:'She arranged the room beautifully.', difficulty:4, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'把',pinyin:'bǎ',role:'把'},{text:'房间',pinyin:'fángjiān',role:'O'},{text:'布置',pinyin:'bùzhì',role:'V'},{text:'得',pinyin:'de',role:'得'},{text:'很漂亮',pinyin:'hěn piàoliang',role:'Comp'}] },
  { id:'ba-comp-03', structure_id:'ba-comp', english:'He explained the question very clearly.', difficulty:4, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'把',pinyin:'bǎ',role:'把'},{text:'问题',pinyin:'wèntí',role:'O'},{text:'说',pinyin:'shuō',role:'V'},{text:'得',pinyin:'de',role:'得'},{text:'很清楚',pinyin:'hěn qīngchu',role:'Comp'}] },
  { id:'ba-comp-04', structure_id:'ba-comp', english:'Mom cooked the meal very deliciously.', difficulty:4, components:[
    {text:'妈妈',pinyin:'māma',role:'S'},{text:'把',pinyin:'bǎ',role:'把'},{text:'饭',pinyin:'fàn',role:'O'},{text:'做',pinyin:'zuò',role:'V'},{text:'得',pinyin:'de',role:'得'},{text:'很好吃',pinyin:'hěn hǎochī',role:'Comp'}] },
  { id:'ba-comp-05', structure_id:'ba-comp', english:'She painted the wall very white.', difficulty:4, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'把',pinyin:'bǎ',role:'把'},{text:'墙',pinyin:'qiáng',role:'O'},{text:'刷',pinyin:'shuā',role:'V'},{text:'得',pinyin:'de',role:'得'},{text:'很白',pinyin:'hěn bái',role:'Comp'}] },
  // ===== L4: 被字句带施事 (5句) =====
  { id:'bei-agent-01', structure_id:'bei-agent', english:'The book was read by me.', difficulty:4, components:[
    {text:'书',pinyin:'shū',role:'O'},{text:'被',pinyin:'bèi',role:'被'},{text:'我',pinyin:'wǒ',role:'S'},{text:'看',pinyin:'kàn',role:'V'},{text:'完了',pinyin:'wán le',role:'Result'}] },
  { id:'bei-agent-02', structure_id:'bei-agent', english:'The cake was eaten by little brother.', difficulty:4, components:[
    {text:'蛋糕',pinyin:'dàngāo',role:'O'},{text:'被',pinyin:'bèi',role:'被'},{text:'弟弟',pinyin:'dìdi',role:'S'},{text:'吃',pinyin:'chī',role:'V'},{text:'掉了',pinyin:'diào le',role:'Result'}] },
  { id:'bei-agent-03', structure_id:'bei-agent', english:'The cup was broken by him.', difficulty:4, components:[
    {text:'杯子',pinyin:'bēizi',role:'O'},{text:'被',pinyin:'bèi',role:'被'},{text:'他',pinyin:'tā',role:'S'},{text:'打',pinyin:'dǎ',role:'V'},{text:'破了',pinyin:'pò le',role:'Result'}] },
  { id:'bei-agent-04', structure_id:'bei-agent', english:'The bicycle was ridden away by someone.', difficulty:4, components:[
    {text:'自行车',pinyin:'zìxíngchē',role:'O'},{text:'被',pinyin:'bèi',role:'被'},{text:'人',pinyin:'rén',role:'S'},{text:'骑',pinyin:'qí',role:'V'},{text:'走了',pinyin:'zǒu le',role:'Result'}] },
  { id:'bei-agent-05', structure_id:'bei-agent', english:'The homework was finished by me.', difficulty:4, components:[
    {text:'作业',pinyin:'zuòyè',role:'O'},{text:'被',pinyin:'bèi',role:'被'},{text:'我',pinyin:'wǒ',role:'S'},{text:'写',pinyin:'xiě',role:'V'},{text:'完了',pinyin:'wán le',role:'Result'}] },
  // ===== L4: 被字句省施事 (5句) =====
  { id:'bei-no-agent-01', structure_id:'bei-no-agent', english:'The window was broken.', difficulty:4, components:[
    {text:'窗户',pinyin:'chuānghu',role:'O'},{text:'被',pinyin:'bèi',role:'被'},{text:'打',pinyin:'dǎ',role:'V'},{text:'开了',pinyin:'kāi le',role:'Result'}] },
  { id:'bei-no-agent-02', structure_id:'bei-no-agent', english:'The door was closed.', difficulty:4, components:[
    {text:'门',pinyin:'mén',role:'O'},{text:'被',pinyin:'bèi',role:'被'},{text:'关',pinyin:'guān',role:'V'},{text:'上了',pinyin:'shàng le',role:'Result'}] },
  { id:'bei-no-agent-03', structure_id:'bei-no-agent', english:'The phone was stolen.', difficulty:4, components:[
    {text:'手机',pinyin:'shǒujī',role:'O'},{text:'被',pinyin:'bèi',role:'被'},{text:'偷',pinyin:'tōu',role:'V'},{text:'了',pinyin:'le',role:'Result'}] },
  { id:'bei-no-agent-04', structure_id:'bei-no-agent', english:'The tree was blown down.', difficulty:4, components:[
    {text:'树',pinyin:'shù',role:'O'},{text:'被',pinyin:'bèi',role:'被'},{text:'吹',pinyin:'chuī',role:'V'},{text:'倒了',pinyin:'dǎo le',role:'Result'}] },
  { id:'bei-no-agent-05', structure_id:'bei-no-agent', english:'The food was eaten up.', difficulty:4, components:[
    {text:'饭菜',pinyin:'fàncài',role:'O'},{text:'被',pinyin:'bèi',role:'被'},{text:'吃',pinyin:'chī',role:'V'},{text:'光了',pinyin:'guāng le',role:'Result'}] },
  // ===== L4: 话题句 (5句) =====
  { id:'topic-comment-01', structure_id:'topic-comment', english:'This book, I have read.', difficulty:4, components:[
    {text:'这本书',pinyin:'zhè běn shū',role:'Topic'},{text:'我',pinyin:'wǒ',role:'S'},{text:'看过',pinyin:'kàn guo',role:'V'}] },
  { id:'topic-comment-02', structure_id:'topic-comment', english:'Chinese, he speaks very well.', difficulty:4, components:[
    {text:'中文',pinyin:'Zhōngwén',role:'Topic'},{text:'他',pinyin:'tā',role:'S'},{text:'说得很好',pinyin:'shuō de hěn hǎo',role:'V'}] },
  { id:'topic-comment-03', structure_id:'topic-comment', english:'That thing, I don\'t know.', difficulty:4, components:[
    {text:'那件事',pinyin:'nà jiàn shì',role:'Topic'},{text:'我',pinyin:'wǒ',role:'S'},{text:'不知道',pinyin:'bù zhīdào',role:'V'}] },
  { id:'topic-comment-04', structure_id:'topic-comment', english:'This movie, everyone likes.', difficulty:4, components:[
    {text:'这部电影',pinyin:'zhè bù diànyǐng',role:'Topic'},{text:'大家',pinyin:'dàjiā',role:'S'},{text:'都喜欢',pinyin:'dōu xǐhuān',role:'V'}] },
  { id:'topic-comment-05', structure_id:'topic-comment', english:'Dinner, mom already made it.', difficulty:4, components:[
    {text:'晚饭',pinyin:'wǎnfàn',role:'Topic'},{text:'妈妈',pinyin:'māma',role:'S'},{text:'已经做好了',pinyin:'yǐjīng zuò hǎo le',role:'V'}] },

  // ===== L5: 一…就… (5句) =====
  { id:'yi-jiu-01', structure_id:'yi-jiu', english:'As soon as I get home, I eat.', difficulty:5, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'一',pinyin:'yī',role:'一'},{text:'回家',pinyin:'huí jiā',role:'V1'},{text:'就',pinyin:'jiù',role:'就'},{text:'吃饭',pinyin:'chī fàn',role:'V2'}] },
  { id:'yi-jiu-02', structure_id:'yi-jiu', english:'As soon as the teacher comes in, students quiet down.', difficulty:5, components:[
    {text:'老师',pinyin:'lǎoshī',role:'S'},{text:'一',pinyin:'yī',role:'一'},{text:'进来',pinyin:'jìnlái',role:'V1'},{text:'就',pinyin:'jiù',role:'就'},{text:'安静了',pinyin:'ānjìng le',role:'V2'}] },
  { id:'yi-jiu-03', structure_id:'yi-jiu', english:'As soon as I lie down, I fall asleep.', difficulty:5, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'一',pinyin:'yī',role:'一'},{text:'躺下',pinyin:'tǎng xià',role:'V1'},{text:'就',pinyin:'jiù',role:'就'},{text:'睡着了',pinyin:'shuì zháo le',role:'V2'}] },
  { id:'yi-jiu-04', structure_id:'yi-jiu', english:'As soon as it rains, it gets cold.', difficulty:5, components:[
    {text:'天',pinyin:'tiān',role:'S'},{text:'一',pinyin:'yī',role:'一'},{text:'下雨',pinyin:'xià yǔ',role:'V1'},{text:'就',pinyin:'jiù',role:'就'},{text:'冷了',pinyin:'lěng le',role:'V2'}] },
  { id:'yi-jiu-05', structure_id:'yi-jiu', english:'As soon as I hear this song, I think of home.', difficulty:5, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'一',pinyin:'yī',role:'一'},{text:'听到这首歌',pinyin:'tīng dào zhè shǒu gē',role:'V1'},{text:'就',pinyin:'jiù',role:'就'},{text:'想家',pinyin:'xiǎng jiā',role:'V2'}] },
  // ===== L5: 比字句 (5句) =====
  { id:'bi-structure-01', structure_id:'bi-structure', english:'He is taller than me.', difficulty:5, components:[
    {text:'他',pinyin:'tā',role:'A'},{text:'比',pinyin:'bǐ',role:'比'},{text:'我',pinyin:'wǒ',role:'B'},{text:'高',pinyin:'gāo',role:'Adj'}] },
  { id:'bi-structure-02', structure_id:'bi-structure', english:'Today is hotter than yesterday.', difficulty:5, components:[
    {text:'今天',pinyin:'jīntiān',role:'A'},{text:'比',pinyin:'bǐ',role:'比'},{text:'昨天',pinyin:'zuótiān',role:'B'},{text:'热',pinyin:'rè',role:'Adj'}] },
  { id:'bi-structure-03', structure_id:'bi-structure', english:'She is prettier than her sister.', difficulty:5, components:[
    {text:'她',pinyin:'tā',role:'A'},{text:'比',pinyin:'bǐ',role:'比'},{text:'姐姐',pinyin:'jiějie',role:'B'},{text:'漂亮',pinyin:'piàoliang',role:'Adj'}] },
  { id:'bi-structure-04', structure_id:'bi-structure', english:'This book is more interesting than that one.', difficulty:5, components:[
    {text:'这本书',pinyin:'zhè běn shū',role:'A'},{text:'比',pinyin:'bǐ',role:'比'},{text:'那本',pinyin:'nà běn',role:'B'},{text:'有意思',pinyin:'yǒuyìsi',role:'Adj'}] },
  { id:'bi-structure-05', structure_id:'bi-structure', english:'He runs faster than me.', difficulty:5, components:[
    {text:'他',pinyin:'tā',role:'A'},{text:'比',pinyin:'bǐ',role:'比'},{text:'我',pinyin:'wǒ',role:'B'},{text:'跑得快',pinyin:'pǎo de kuài',role:'Adj'}] },
  // ===== L5: 是…的 (5句) =====
  { id:'shi-de-01', structure_id:'shi-de', english:'I came yesterday.', difficulty:5, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'是',pinyin:'shì',role:'是'},{text:'昨天',pinyin:'zuótiān',role:'Info'},{text:'来',pinyin:'lái',role:'V'},{text:'的',pinyin:'de',role:'的'}] },
  { id:'shi-de-02', structure_id:'shi-de', english:'He came by plane.', difficulty:5, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'是',pinyin:'shì',role:'是'},{text:'坐飞机',pinyin:'zuò fēijī',role:'Info'},{text:'来',pinyin:'lái',role:'V'},{text:'的',pinyin:'de',role:'的'}] },
  { id:'shi-de-03', structure_id:'shi-de', english:'We met at school.', difficulty:5, components:[
    {text:'我们',pinyin:'wǒmen',role:'S'},{text:'是',pinyin:'shì',role:'是'},{text:'在学校',pinyin:'zài xuéxiào',role:'Info'},{text:'认识',pinyin:'rènshi',role:'V'},{text:'的',pinyin:'de',role:'的'}] },
  { id:'shi-de-04', structure_id:'shi-de', english:'I went with him.', difficulty:5, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'是',pinyin:'shì',role:'是'},{text:'跟他一起',pinyin:'gēn tā yīqǐ',role:'Info'},{text:'去',pinyin:'qù',role:'V'},{text:'的',pinyin:'de',role:'的'}] },
  { id:'shi-de-05', structure_id:'shi-de', english:'This was made in China.', difficulty:5, components:[
    {text:'这个',pinyin:'zhège',role:'S'},{text:'是',pinyin:'shì',role:'是'},{text:'在中国',pinyin:'zài Zhōngguó',role:'Info'},{text:'制造',pinyin:'zhìzào',role:'V'},{text:'的',pinyin:'de',role:'的'}] },
  // ===== L5: 连…都/也 (5句) =====
  { id:'lian-dou-01', structure_id:'lian-dou', english:'Even a child knows that.', difficulty:5, components:[
    {text:'连',pinyin:'lián',role:'连'},{text:'小孩子',pinyin:'xiǎoháizi',role:'O'},{text:'都',pinyin:'dōu',role:'都'},{text:'知道',pinyin:'zhīdào',role:'V'}] },
  { id:'lian-dou-02', structure_id:'lian-dou', english:'He didn\'t even eat breakfast.', difficulty:5, components:[
    {text:'他',pinyin:'tā',role:'S'},{text:'连',pinyin:'lián',role:'连'},{text:'早饭',pinyin:'zǎofàn',role:'O'},{text:'都',pinyin:'dōu',role:'都'},{text:'没吃',pinyin:'méi chī',role:'V'}] },
  { id:'lian-dou-03', structure_id:'lian-dou', english:'I can\'t even write one character.', difficulty:5, components:[
    {text:'我',pinyin:'wǒ',role:'S'},{text:'连',pinyin:'lián',role:'连'},{text:'一个字',pinyin:'yī ge zì',role:'O'},{text:'都',pinyin:'dōu',role:'都'},{text:'不会写',pinyin:'bù huì xiě',role:'V'}] },
  { id:'lian-dou-04', structure_id:'lian-dou', english:'Not even one person came.', difficulty:5, components:[
    {text:'连',pinyin:'lián',role:'连'},{text:'一个人',pinyin:'yī ge rén',role:'O'},{text:'都',pinyin:'dōu',role:'都'},{text:'没来',pinyin:'méi lái',role:'V'}] },
  { id:'lian-dou-05', structure_id:'lian-dou', english:'She doesn\'t even have a cell phone.', difficulty:5, components:[
    {text:'她',pinyin:'tā',role:'S'},{text:'连',pinyin:'lián',role:'连'},{text:'手机',pinyin:'shǒujī',role:'O'},{text:'都',pinyin:'dōu',role:'都'},{text:'没有',pinyin:'méiyǒu',role:'V'}] },
  // ===== L5: 如果…就… (5句) =====
  { id:'ruguo-jiu-01', structure_id:'ruguo-jiu', english:'If it rains, I won\'t go.', difficulty:5, components:[
    {text:'如果',pinyin:'rúguǒ',role:'如果'},{text:'下雨',pinyin:'xià yǔ',role:'Cond'},{text:'我',pinyin:'wǒ',role:'S'},{text:'就',pinyin:'jiù',role:'就'},{text:'不去了',pinyin:'bù qù le',role:'Result'}] },
  { id:'ruguo-jiu-02', structure_id:'ruguo-jiu', english:'If you have time, let\'s meet.', difficulty:5, components:[
    {text:'如果',pinyin:'rúguǒ',role:'如果'},{text:'有时间',pinyin:'yǒu shíjiān',role:'Cond'},{text:'我们',pinyin:'wǒmen',role:'S'},{text:'就',pinyin:'jiù',role:'就'},{text:'见面吧',pinyin:'jiànmiàn ba',role:'Result'}] },
  { id:'ruguo-jiu-03', structure_id:'ruguo-jiu', english:'If you\'re tired, rest for a while.', difficulty:5, components:[
    {text:'如果',pinyin:'rúguǒ',role:'如果'},{text:'累了',pinyin:'lèi le',role:'Cond'},{text:'你',pinyin:'nǐ',role:'S'},{text:'就',pinyin:'jiù',role:'就'},{text:'休息一下',pinyin:'xiūxi yīxià',role:'Result'}] },
  { id:'ruguo-jiu-04', structure_id:'ruguo-jiu', english:'If it\'s too expensive, I won\'t buy it.', difficulty:5, components:[
    {text:'如果',pinyin:'rúguǒ',role:'如果'},{text:'太贵',pinyin:'tài guì',role:'Cond'},{text:'我',pinyin:'wǒ',role:'S'},{text:'就',pinyin:'jiù',role:'就'},{text:'不买了',pinyin:'bù mǎi le',role:'Result'}] },
  { id:'ruguo-jiu-05', structure_id:'ruguo-jiu', english:'If it doesn\'t work, try again.', difficulty:5, components:[
    {text:'如果',pinyin:'rúguǒ',role:'如果'},{text:'不行',pinyin:'bù xíng',role:'Cond'},{text:'你',pinyin:'nǐ',role:'S'},{text:'就',pinyin:'jiù',role:'就'},{text:'再试试',pinyin:'zài shì shi',role:'Result'}] },
];

export async function seed(): Promise<void> {
  const db = await getDb();
  const count = db.exec("SELECT COUNT(*) as c FROM grammar_structures")[0];
  if (count && (count.values[0][0] as number) > 0) {
    console.log('Database already seeded, skipping.');
    return;
  }
  console.log('Seeding database...');
  const insS = db.prepare(
    `INSERT INTO grammar_structures (id,name_zh,name_en,difficulty,template,description_zh) VALUES (?,?,?,?,?,?)`
  );
  const insSen = db.prepare(
    `INSERT INTO sentences (id,structure_id,english,difficulty,full_text) VALUES (?,?,?,?,?)`
  );
  const insCmp = db.prepare(
    `INSERT INTO sentence_components (sentence_id,position,text,pinyin,role) VALUES (?,?,?,?,?)`
  );
  for (const s of structures) {
    insS.run([s.id,s.name_zh,s.name_en,s.difficulty,s.template,s.description_zh]);
  }
  for (const s of sentences) {
    const ft = s.components.map(c=>c.text).join('');
    insSen.run([s.id,s.structure_id,s.english,s.difficulty,ft]);
    for (let i=0;i<s.components.length;i++) {
      const c=s.components[i];
      insCmp.run([s.id,i,c.text,c.pinyin,c.role]);
    }
  }
  insS.free(); insSen.free(); insCmp.free();
  saveDb();
  console.log(`Seeded ${structures.length} structures and ${sentences.length} sentences.`);
}

// CLI runner
const args = process.argv.slice(2);
if (args.includes('--run')) {
  initSchema().then(()=>seed()).then(()=>{
    console.log('Seed complete.');
    process.exit(0);
  }).catch(e=>{console.error(e);process.exit(1);});
}
