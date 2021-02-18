import { config } from 'dotenv'
config()
import axios from 'axios'
import fs  from 'fs'
import path from 'path'


import docx from 'docx'
const { Document, Packer, Paragraph, TextRun } = docx;

const BASE_URL = 'https://graph.facebook.com/'
const TOKEN_ACESSO = process.env.TOKEN_ACESSO
const ID_USUARIO = process.env.ID_USUARIO
const DELAY_REQUEST = 1000
const YEAR_FEED = 2013
const FIRST_PAGE = `${BASE_URL}/${ID_USUARIO}?fields=feed.since(01/01/${YEAR_FEED}).until(02/18/${YEAR_FEED})&access_token=${TOKEN_ACESSO}`
const PATH_FILE = path.resolve('tmp')


async function * getPaginated(page) {
    const {data : response} = await axios.get(page)
  
    const { data, paging  } = response?.feed ?? response
   
    if(data.length === 0)return
  
    yield data
    await sleep()
    yield* getPaginated(paging.next)
}

async function sleep(){
    return new Promise((resolve)=>setTimeout(resolve,DELAY_REQUEST))
}

try{
    const doc = new Document();
    

    const b64string = await Packer.toBase64String(doc);
    let ret
    const iterator = getPaginated(FIRST_PAGE)
    for await(const items of iterator){
        
        ret = items.map(item=>{
            if(item?.message){
                const date = new Date(item.created_time)
                return  `Data da publicação: ${date.toLocaleString()}\n${item.message}` 
            } 
         })

         doc.addSection({
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: ret.join('\n\n'),
                            bold: true,
                        }),
                    ],
                }),
            ],
        });
      
        const buffer = await Packer.toBuffer(doc) 
        fs.writeFileSync(`${PATH_FILE}/${YEAR_FEED}.docx`, buffer);
    }  
}catch(err){
    console.log('Error' , err)
}
