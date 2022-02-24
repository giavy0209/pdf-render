const fs = require('fs');
const pdf = require('pdf-parse');
let dataBuffer = fs.readFileSync('./pdf.pdf');
let data = []
async function render_page(pageData) {
    const textContent = await pageData.getTextContent()
    data = [...data, ...textContent.items]


    let lastY, text = '';
    for (let item of textContent.items) {
        if (lastY == item.transform[5] || !lastY){
            text += item.str;
        }  
        else{
            text += '\n' + item.str;
        }    
        lastY = item.transform[5];
    }
    return text;
}
function indexesOf(string, regex) {
    var match,
        indexes = [];

    regex = new RegExp(regex);

    while (match = regex.exec(string)) {
        indexes.push(match.index);
    }

    return indexes;
}
async function extractPDF() {
    const data = await pdf(dataBuffer, {
        pagerender: render_page,
    })
    const text = data.text
    const textLower = text.toLocaleLowerCase()
    const question = []

    const indexesOfStartQuestion = indexesOf(text , /Câu/g)
    const indexesOfBreakLine = indexesOf(text , /\n/g)
    const endQuest = textLower.lastIndexOf('hết')
    for (let index = 0; index < indexesOfStartQuestion.length; index++) {
        const i = indexesOfStartQuestion[index];
        if(i > endQuest) break
        const nextBreakLine = indexesOfBreakLine.find(o => o > i)

        const q = {}
        q.quest = text.slice(i , nextBreakLine)
        q.end = nextBreakLine
        question.push (q)
    }

    const anwserA = indexesOf(text , /A./g)
    const anwserB = indexesOf(text , /B./g)
    const anwserC = indexesOf(text , /C./g)
    const anwserD = indexesOf(text , /D./g)

    for (let index = 0; index < question.length; index++) {
        const quest = question[index];
        const A = anwserA.find(o => o > quest.end)
        const B = anwserB.find(o => o > A)
        const C = anwserC.find(o => o > B)
        const D = anwserD.find(o => o > C)

        const nextBreakLine = indexesOfBreakLine.find(o => o > D)
        quest.A = text.slice(A , B).trim()
        quest.B = text.slice(B , C).trim()
        quest.C = text.slice(C , D).trim()
        quest.D = text.slice(D , nextBreakLine).trim()

        const regex = new RegExp(`${index + 1}.`, 'g')
        const indexesOfAwnser = indexesOf(text , regex )
        const anwser = indexesOfAwnser.find(o => o > endQuest)
        const indexesOfNextAwnser = indexesOf(text , new RegExp(`${index + 2}.` , 'g') )
        const nextAnwser = indexesOfNextAwnser.find(o => o > anwser)
        quest.anwser = text.slice(anwser , nextAnwser).replace(regex , '').trim()
    }

    fs.writeFileSync('./question.json' , JSON.stringify(question , null , 2))
}
extractPDF() 