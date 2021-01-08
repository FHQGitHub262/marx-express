const { Document, Paragraph, Packer, TextRun } = require("docx");

function renderAnswer(answer) {
  if (String(answer).toUpperCase() === 'TRUE') {
    return "正确"
  } else if (String(answer).toUpperCase() === 'FALSE') {
    return "错误"
  } else {
    return answer
  }
}

async function renderWord(data = '未作答') {
  const doc = new Document();
  const children = [
    new Paragraph({
      alignment: "center",
      children: [
        new TextRun(data.exam.name),
      ],
    }),
    new Paragraph({
      alignment: "right",
      children: [
        new TextRun({
          text: data.user.name
        }),
      ],
    }),
    new Paragraph({
      alignment: "right",
      children: [
        new TextRun({
          text: data.user.id || ""
        }),
      ],
    }),
    new Paragraph({
      alignment: "right",
      children: [
        new TextRun({
          text: `得分：${data.exam.grade || ""}`
        }),
      ],
    }),
  ]

  const types = ['single', 'multi', 'truefalse']
  const typesMap = {
    single: "单项选择题",
    multi: "双项选择题",
    truefalse: "判断题"
  }
  const content = types.reduce((prev, type) => {
    // console.log(data.paper, data.paper[type])
    if (data.paper[type] !== undefined) {
      const result = Object.values(data.paper[type])
        .reduce((prevParagraph, currVO, index) => {
          const { questionVO, answer } = currVO
          const { title = "", detail: unParsedDetail, right, difficult } = questionVO
          const detail = JSON.parse(unParsedDetail)
          return [
            ...prevParagraph,
            new Paragraph({
              alignment: 'left',
              children: [
                new TextRun(`[${difficult}]${index + 1}. ${title}`)
              ]
            }),
            ...(() => {
              if (type !== 'truefalse') {
                return Object.keys(detail).map(option => new Paragraph({
                  children: [
                    new TextRun(`${option}、${detail[option]}`)
                  ]
                }))
              } else {
                return []
              }
            })(),
            new Paragraph({
              children: [
                new TextRun(`正确答案：${JSON.parse(right).map(item => renderAnswer(item)).join()}`)
              ]
            }),
            new Paragraph({
              children: [
                new TextRun(`学生答案：${renderAnswer(answer)}`)
              ]
            }),
            new Paragraph({
              children: []
            }),
          ]
        }, [
          new Paragraph({
            alignment: "left",
            children: [
              new TextRun(typesMap[type]),
            ],
          }),
          new Paragraph({
            alignment: "left",
            children: [

            ],
          }),
        ])
      return [...prev, ...result]
    } else return prev
  }, [])

  doc.addSection({
    properties: {},
    children: [
      ...children,
      ...content
    ]
  });

  return await Packer.toBuffer(doc)
}

exports.renderWord = renderWord