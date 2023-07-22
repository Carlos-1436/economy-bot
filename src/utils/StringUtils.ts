const formatDateToDiscord = (date: Date) => { return `*${date.getDate()}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}* ***ás*** *${date.getHours()}:${date.getMinutes()}*` };

const formatDate = (date: Date) => { return `${date.getDate()}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ás ${date.getHours()}:${date.getMinutes()}` };

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2
});

const isEmote = (emoteString: string) => emoteString.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu);

export { formatDateToDiscord, formatDate, moneyFormatter, isEmote };