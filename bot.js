const puppeteer = require("puppeteer")
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

const client = new Client({
authStrategy: new LocalAuth({
clientId: "diario-bot"
}),
puppeteer: {
executablePath: puppeteer.executablePath(),
headless: true,
args: [
"--no-sandbox",
"--disable-setuid-sandbox",
"--disable-dev-shm-usage",
"--disable-accelerated-2d-canvas",
"--no-first-run",
"--no-zygote",
"--single-process",
"--disable-gpu"
]
}
})

const GRUPO_ADMIN = "120363424636007004@g.us"
const GRUPO_ORG = "120363422664362515@g.us"

const LIMITE = 24
const TEMPO = 300000

let lista = []
let reservas = {}
let cadastro = {}
let ranking = {}
let vagasAbertas = true

client.on('qr', qr => {
qrcode.generate(qr,{small:true})
})

client.on('ready', () => {
console.log("BOT ONLINE")
})

client.on('message', async msg => {

const texto = msg.body ? msg.body.toLowerCase() : ""
const user = msg.from

// DESCOBRIR ID
if(texto === "/idgrupo"){
msg.reply("ID DO GRUPO:\n" + msg.from)
}

// MENU
if(texto === "/menu"){
msg.reply(`🎮 MENU DO CAMPEONATO

/vaga
➡️ Reservar vaga para seu DUO

/lista
➡️ Ver lista de pagamentos confirmados

/times
➡️ Ver duos confirmados

/vagas
➡️ Ver vagas restantes

/ranking
➡️ Ranking de kills

/cancelar
➡️ Cancelar reserva

/regras
➡️ Ver regras da sala`)
}

// RESERVAR
if(texto === "/vaga"){

if(!vagasAbertas){
msg.reply("🚫 Vagas fechadas")
return
}

if(lista.length >= LIMITE){
msg.reply("❌ SALA LOTADA")
return
}

if(reservas[user]){
msg.reply("⚠️ Você já reservou vaga")
return
}

cadastro[user] = { etapa: 1 }

msg.reply("🎮 Envie o NICK do primeiro jogador")
return
}

// CADASTRO
if(cadastro[user]){

if(cadastro[user].etapa === 1){

cadastro[user].nick1 = msg.body
cadastro[user].etapa = 2

msg.reply("🎮 Agora envie o NICK do segundo jogador")
return
}

if(cadastro[user].etapa === 2){

cadastro[user].nick2 = msg.body

reservas[user] = {
nick1: cadastro[user].nick1,
nick2: cadastro[user].nick2,
numero: user
}

delete cadastro[user]

let vagas = LIMITE - lista.length

msg.reply(`🎮 VAGA RESERVADA

DUO:
👤 ${reservas[user].nick1}
👤 ${reservas[user].nick2}

Valor: R$6

PIX
21982635113

Envie o comprovante

⏱️ Tempo limite: 5 minutos

Vagas restantes: ${vagas}`)

setTimeout(()=>{

if(reservas[user]){

delete reservas[user]

client.sendMessage(user,
`❌ VAGA CANCELADA

Tempo para pagamento expirou.`)

}

},TEMPO)

return
}

}

// LISTA
if(texto === "/lista"){

let mensagem = "🎮 LISTA DA SALA\n\n"

lista.forEach((j,i)=>{
mensagem += `${i+1} - ${j.nick1} / ${j.nick2}\n`
})

msg.reply(mensagem)
}

// TIMES
if(texto === "/times"){

if(lista.length === 0){
msg.reply("⚠️ Nenhum time confirmado")
return
}

let mensagem = "🎮 TIMES CONFIRMADOS\n\n"

lista.forEach((j,i)=>{
mensagem += `${i+1}️⃣ ${j.nick1} / ${j.nick2}\n`
})

msg.reply(mensagem)
}

// VAGAS
if(texto === "/vagas"){

let vagas = LIMITE - lista.length

msg.reply(`🎮 VAGAS

Total: ${LIMITE}
Preenchidas: ${lista.length}
Restantes: ${vagas}`)
}

// CANCELAR
if(texto === "/cancelar"){

if(reservas[user]){
delete reservas[user]
msg.reply("❌ Reserva cancelada")
return
}

msg.reply("⚠️ Você não possui reserva")
}

// REGRAS
if(texto === "/regras"){

msg.reply(`⬇️ PROIBIDO ⬇️

❌ Contas abaixo do level 20
❌ Emulador com 2 snipers
❌ Atropelar
❌ Trogon
❌ Barret
❌ M590
❌ AWM

⚠️ Apenas 1 sniper por time

⚠️ Salvar replay obrigatório`)
}

// COMPROVANTE
if(msg.hasMedia){

if(!reservas[user]){
msg.reply("⚠️ Você não reservou vaga")
return
}

const media = await msg.downloadMedia()

const nick1 = reservas[user].nick1
const nick2 = reservas[user].nick2

msg.reply("⏳ Comprovante enviado para análise")

await client.sendMessage(GRUPO_ADMIN, media, {
caption: `💳 PAGAMENTO

👤 ${nick1}
👤 ${nick2}

!confirmar ${user}
!recusar ${user}`
})

}

// CONFIRMAR
if(texto.startsWith("!confirmar") && msg.from === GRUPO_ADMIN){

const id = texto.split(" ")[1]

if(!reservas[id]){
msg.reply("⚠️ Reserva não encontrada")
return
}

lista.push(reservas[id])
delete reservas[id]

client.sendMessage(id,
`✅ PAGAMENTO CONFIRMADO

Sua vaga foi garantida.`)

msg.reply("✅ Jogador confirmado")

}

// RECUSAR
if(texto.startsWith("!recusar") && msg.from === GRUPO_ADMIN){

const id = texto.split(" ")[1]

if(!reservas[id]){
msg.reply("⚠️ Reserva não encontrada")
return
}

delete reservas[id]

client.sendMessage(id,
`❌ Pagamento recusado`)

msg.reply("❌ Pagamento recusado")

}

// SALA
if(texto.startsWith("!sala") && msg.from === GRUPO_ADMIN){

const partes = msg.body.split(" ")

const idSala = partes[1]
const senha = partes[2]

if(!idSala || !senha){
msg.reply("Use: !sala ID SENHA")
return
}

await client.sendMessage(GRUPO_ORG,
`🎮 SALA LIBERADA

🆔 ID: ${idSala}
🔑 SENHA: ${senha}

⏳ GO EM 5 MINUTOS`)

for(let time of lista){

await client.sendMessage(time.numero,
`🎮 SALA DO DIÁRIO

ID: ${idSala}
SENHA: ${senha}`)
}

// GO AUTOMÁTICO
setTimeout(()=>{

client.sendMessage(GRUPO_ORG,
`🚀 GO GO GO

Sala iniciando agora!`)

},300000)

msg.reply("✅ Sala enviada")

}

// KILLS
if(texto.startsWith("!kill") && msg.from === GRUPO_ADMIN){

const partes = msg.body.split(" ")
const nome = partes[1]
const qtd = parseInt(partes[2])

if(!ranking[nome]){
ranking[nome] = 0
}

ranking[nome] += qtd

msg.reply(`🔥 ${nome} agora tem ${ranking[nome]} kills`)
}

// RANKING
if(texto === "/ranking"){

let mensagem = "🏆 RANKING\n\n"

for(let nome in ranking){
mensagem += `${nome} - ${ranking[nome]} kills\n`
}

msg.reply(mensagem)
}

// RESULTADO
if(texto.startsWith("!resultado") && msg.from === GRUPO_ADMIN){

const partes = msg.body.split(" ")
const pos = partes[1]
const time = partes.slice(2).join(" ")

msg.reply(`🏆 RESULTADO

${pos}º Lugar
${time}`)
}

// PAINEL ADMIN
if(texto === "/paineladm" && msg.from === GRUPO_ADMIN){

msg.reply(`👑 PAINEL ADMIN

!confirmar ID
!recusar ID
!sala ID SENHA
!kill NOME QTD
!resultado POS TIME

/resetar
/fechar
/abrir`)
}

// RESETAR
if(texto === "/resetar" && msg.from === GRUPO_ADMIN){

lista = []
reservas = {}

msg.reply("🔄 Sala resetada")
}

// FECHAR
if(texto === "/fechar" && msg.from === GRUPO_ADMIN){

vagasAbertas = false
msg.reply("🔒 Vagas fechadas")
}

// ABRIR
if(texto === "/abrir" && msg.from === GRUPO_ADMIN){

vagasAbertas = true
msg.reply("🟢 Vagas abertas")
}

})

client.initialize()