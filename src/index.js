import { config } from 'dotenv'
config()
import axios from 'axios'
import fs from 'fs'
import path from 'path'


const BASE_URL = 'https://graph.facebook.com/'
const TOKEN_ACCESS = process.env.TOKEN_ACCESS_APP
const ID_USER = process.env.ID_USER_APP
const DELAY_REQUEST = 1000
const YEAR_FEED_START = 2021
const YEAR_FEED_END = 2021
const FIRST_PAGE = `${BASE_URL}/${ID_USER}?fields=feed.since(01/01/${YEAR_FEED_START}).until(12/31/${YEAR_FEED_END})&access_token=${TOKEN_ACCESS}`
const PATH_FILE = path.resolve('tmp')


function prepareFile(item){
    if(item?.message){
        const date = new Date(item.created_time)
        return  `Data da publicação: ${date.toLocaleString()}\n${item.message.replace(/\n/g,'')}` 
    } 
}

async function * getPaginated(page) {
    const {data : response} = await axios.get(page)
  
    const { data, paging  } = response?.feed ?? response
   
    if(data.length === 0)return
  
    const newData = data.map(prepareFile)

    yield newData.join('\n\n')

    await sleep()

    yield* getPaginated(paging.next)
}

async function sleep(){
    return new Promise((resolve)=>setTimeout(resolve,DELAY_REQUEST))
}

try{
    const writer = fs.createWriteStream(`${PATH_FILE}/${YEAR_FEED_START}_a_${YEAR_FEED_END}.txt`, {
        flags: "w",
    });

    writer.on('error', ()=>{
        console.log('Erro ao escrever no arquivo.')
    })

    writer.on('finish', ()=>{
        console.log('Arquivo escrito com sucesso.')
    })

    setInterval(() => { process.stdout.write('.') }, DELAY_REQUEST).unref()

    const iterator = getPaginated(FIRST_PAGE)
    
    for await(const items of iterator){
        writer.write(items);
    }  

    writer.end();

}catch(err){
    console.log('Error' , err)
}

    
   