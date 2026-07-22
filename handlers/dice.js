const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
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

async function handleDiceCommand(interaction) {
    const subCommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    let db = loadData();

    if (!db[userId]) {
        db[userId] = { score: 0, lastCheckIn: "" };
    }

    // [1] 기본 주사위 굴리기 (/주사위 굴리기 [포인트])
    if (subCommand === '굴리기') {
        const betPoint = interaction.options.getInteger('포인트') || 0;

        if (betPoint > 0) {
            if (db[userId].score < betPoint) {
                return interaction.reply({ content: `❌ 보유한 포인트가 부족합니다! (현재 포인트: ${db[userId].score}점)`, ephemeral: true });
            }
            db[userId].score -= betPoint;
        }

        const myRoll = Math.floor(Math.random() * 6) + 1; // 1~6 무작위
        let resultText = "";
        let earned = 0;

        if (betPoint > 0) {
            if (myRoll >= 4) { // 4, 5, 6 승리 (2배 환급)
                earned = betPoint * 2;
                db[userId].score += earned;
                resultText = `🎉 성공! (4~6)\n베팅하신 포인트의 2배인 **+${earned}점**을 획득하셨습니다!`;
            } else { // 1, 2, 3 패배
                resultText = `😢 실패! (1~3)\n베팅하신 포인트 **${betPoint}점**을 잃었습니다.`;
            }
        } else {
            earned = myRoll * 10;
            db[userId].score += earned;
            resultText = `🎲 주사위 눈금 **${myRoll}**이 나와서 **+${earned} 포인트**를 획득했습니다!`;
        }

        saveData(db);

        const embed = new MessageEmbed()
            .setTitle('🎲 주사위 굴리기 결과')
            .setColor('#3498DB')
            .setDescription(`${interaction.user}님의 주사위 결과: **[ ${myRoll} ]**`)
            .addField('결과 안내', resultText, false)
            .addField('📊 내 잔액', `${db[userId].score} 점`, true)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }

    // [2] PVP 대결 신청 (/주사위 대결 [상대] [포인트])
    if (subCommand === '대결') {
        const targetUser = interaction.options.getUser('상대');
        const betPoint = interaction.options.getInteger('포인트');

        if (targetUser.bot || targetUser.id === userId) {
            return interaction.reply({ content: "❌ 봇이나 자기 자신과는 대결할 수 없습니다.", ephemeral: true });
        }

        if (db[userId].score < betPoint) {
            return interaction.reply({ content: `❌ 포인트를 너무 많이 걸었습니다! (현재 내 포인트: ${db[userId].score}점)`, ephemeral: true });
        }

        let targetDb = loadData();
        if (!targetDb[targetUser.id] || targetDb[targetUser.id].score < betPoint) {
            return interaction.reply({ content: `❌ 상대방이 베팅할 포인트(${betPoint}점)를 보유하고 있지 않습니다.`, ephemeral: true });
        }

        const row = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('dice_accept').setLabel('수락하기').setStyle('SUCCESS'),
            new MessageButton().setCustomId('dice_deny').setLabel('거절하기').setStyle('DANGER')
        );

        const embed = new MessageEmbed()
            .setTitle('⚔️ 주사위 1:1 대결 신청!')
            .setColor('#E67E22')
            .setDescription(`${interaction.user}님이 ${targetUser}님에게 **${betPoint} 포인트**빵 주사위 대결을 신청했습니다!\n\n30초 안에 아래 버튼을 눌러주세요.`);

        const replyMessage = await interaction.reply({ content: `${targetUser}`, embeds: [embed], components: [row], fetchReply: true });

        const filter = i => i.user.id === targetUser.id;
        const collector = replyMessage.createMessageComponentCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', async i => {
            if (i.customId === 'dice_deny') {
                await i.update({ content: '❌ 상대가 대결을 거절했습니다.', embeds: [], components: [] });
                return;
            }

            if (i.customId === 'dice_accept') {
                let currentDb = loadData();
                if (currentDb[userId].score < betPoint || currentDb[targetUser.id].score < betPoint) {
                    return i.update({ content: '❌ 대결 중 포인트 부족으로 경기가 취소되었습니다.', embeds: [], components: [] });
                }

                const myRoll = Math.floor(Math.random() * 6) + 1;
                const targetRoll = Math.floor(Math.random() * 6) + 1;

                let winnerText = "";
                if (myRoll > targetRoll) {
                    currentDb[userId].score += betPoint;
                    currentDb[targetUser.id].score -= betPoint;
                    winnerText = `🏆 승자: ${interaction.user} (+${betPoint}점 획득!)`;
                } else if (myRoll < targetRoll) {
                    currentDb[userId].score -= betPoint;
                    currentDb[targetUser.id].score += betPoint;
                    winnerText = `🏆 승자: ${targetUser} (+${betPoint}점 획득!)`;
                } else {
                    winnerText = `🤝 무승부! 포인트를 반환합니다.`;
                }

                saveData(currentDb);

                const resultEmbed = new MessageEmbed()
                    .setTitle('🎲 주사위 1:1 대결 결과!')
                    .setColor('#F1C40F')
                    .addFields(
                        { name: `${interaction.user.username}의 주사위`, value: `[ **${myRoll}** ]`, inline: true },
                        { name: `${targetUser.username}의 주사위`, value: `[ **${targetRoll}** ]`, inline: true },
                        { name: '결과', value: winnerText, inline: false }
                    )
                    .setTimestamp();

                await i.update({ content: null, embeds: [resultEmbed], components: [] });
            }
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                await replyMessage.edit({ content: '⏰ 시간이 초과되어 대결 신청이 만료되었습니다.', embeds: [], components: [] }).catch(() => {});
            }
        });
    }
}

module.exports = { handleDiceCommand };