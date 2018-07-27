


const buf = Buffer.from([0,0,0,5])

const buf2 = Buffer.concat([buf,Buffer.from([0,0,0,6])],buf.length+4)
//console.log(buf.readInt32LE(0))
//console.log(buf.slice(4))
console.log(buf2)


console.log(buf2.readInt32BE(0))
const buf3 = buf2.slice(4)
console.log(buf3)


async function myFunc(){
    return 1
}

myFunc().then(console.log)