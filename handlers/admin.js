const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../points.json');

function loadData() {
    try {
        if (!fs.existsSync(dataFilePath)) return {};
        return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    } catch (error) {
        return {};
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('데이터 저장 오류:', error);
    }
}

async function handleAdminCommand(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({ content: "❌ 이 명령어는 관리자만 사용할 수 있습니다.", ephemeral: true });
    }

    const subCommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('유저');
    const amount = interaction.options.getInteger('포인트');

    let db = loadData();
    if (!db[targetUser.id]) {
        db[targetUser.id] = { score: 0, lastCheckIn: "" };
    }

    if (subCommand === '지급') {
        db[targetUser.id].score += amount;
        saveData(db);

        const embed = new MessageEmbed()
            .setTitle('➕ 관리자 포인트 지급 완료')
            .setColor('#2ECC71')
            .setDescription(`${targetUser}님에게 **${amount} 포인트**가 지급되었습니다.`)
            .addField('현재 보유 포인트', `${db[targetUser.id].score} 점`, true)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }

    if (subCommand === '차감') {
        db[targetUser.id].score -= amount;
        saveData(db);

        const embed = new MessageEmbed()
            .setTitle('➖ 관리자 포인트 차감 완료')
            .setColor('#E74C3C')
            .setDescription(`${targetUser}님의 포인트에서 **${amount} 포인트**가 차감되었습니다.`)
            .addField('현재 보유 포인트', `${db[targetUser.id].score} 점`, true)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
}

module.exports = { handleAdminCommand };