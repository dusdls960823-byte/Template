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

async function handleCommand(interaction) {
    const { commandName } = interaction;

    // 1. 명령어 도움말
    if (commandName === '명령어') {
        const embed = new MessageEmbed()
            .setTitle('🎉 커뮤니티 이벤트 & 활성화 봇 명령어')
            .setColor('#5865F2')
            .setDescription('서버 멤버들을 위한 슬래시 명령어 안내입니다.')
            .addFields(
                { name: '/출석체크', value: '매일 참여하고 포인트를 받으세요!', inline: false },
                { name: '/포인트', value: '내 보유 포인트를 확인합니다.', inline: false },
                { name: '/랭킹', value: '서버 내 포인트 상위 랭킹을 확인합니다.', inline: false },
                { name: '/서버정보', value: '현재 서버의 상세 정보를 확인합니다.', inline: false },
                { name: '/주사위 굴리기 [포인트]', value: '1~6 주사위를 굴리고 포인트를 겁니다!', inline: false },
                { name: '/주사위 대결 [상대] [포인트]', value: '다른 유저와 포인트를 걸고 1:1 대결을 합니다!', inline: false },
                { name: '/추첨 [상품]', value: '(관리자용) 현재 채널에서 랜덤으로 당첨자를 뽑습니다.', inline: false },
                { name: '/공지 [내용]', value: '(관리자용) 멋진 임베드 공지를 보냅니다.', inline: false }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 2. 출석 체크 기능
    if (commandName === '출석체크') {
        const userId = interaction.user.id;
        const today = new Date().toDateString();
        
        let db = loadData();
        
        if (!db[userId]) {
            db[userId] = { score: 0, lastCheckIn: "" };
        }
        
        if (db[userId].lastCheckIn === today) {
            return interaction.reply({ content: "⏳ 오늘은 이미 출석체크를 완료하셨습니다! 내일 다시 도전해 주세요.", ephemeral: true });
        }

        db[userId].score += 100;
        db[userId].lastCheckIn = today;
        saveData(db);

        const embed = new MessageEmbed()
            .setTitle('✅ 출석 체크 성공!')
            .setColor('#57F287')
            .setDescription(`${interaction.user}님, 오늘 출석이 완료되었습니다!`)
            .addField('보상', '+100 포인트 지급', true)
            .addField('현재 포인트', `${db[userId].score} 점`, true)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }

    // 3. 포인트 확인 기능
    if (commandName === '포인트') {
        const userId = interaction.user.id;
        const db = loadData();
        const userScore = db[userId] ? db[userId].score : 0;

        const embed = new MessageEmbed()
            .setTitle('📊 내 활동 포인트')
            .setColor('#FEE75C')
            .setDescription(`${interaction.user}님의 현재 포인트는 **${userScore}점** 입니다.`);

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 4. 랭킹 확인 기능
    if (commandName === '랭킹') {
        const db = loadData();
        const entries = Object.entries(db);
        
        if (entries.length === 0) {
            return interaction.reply({ content: "📊 아직 등록된 포인트 기록이 없습니다.", ephemeral: true });
        }

        entries.sort((a, b) => b[1].score - a[1].score);
        const topUsers = entries.slice(0, 10);

        let rankDescription = "";
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

        topUsers.forEach(([userId, data], index) => {
            const medal = medals[index] || `\`${index + 1}.\``;
            rankDescription += `${medal} <@${userId}> : **${data.score}점**\n`;
        });

        const embed = new MessageEmbed()
            .setTitle('🏆 서버 활동 포인트 랭킹 TOP 10')
            .setColor('#F1C40F')
            .setDescription(rankDescription)
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name} 랭킹 보드`, iconURL: interaction.guild.iconURL() });

        return interaction.reply({ embeds: [embed] });
    }

    // 5. 서버 정보 확인 기능
    if (commandName === '서버정보') {
        const { guild } = interaction;
        const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);

        const embed = new MessageEmbed()
            .setTitle(`🏰 ${guild.name} 서버 정보`)
            .setColor('#2F3136')
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👑 서버 소유자', value: `<@${guild.ownerId}>`, inline: true },
                { name: '📅 서버 생성일', value: `<t:${createdTimestamp}:D> (<t:${createdTimestamp}:R>)`, inline: true },
                { name: '👥 총 멤버 수', value: `${guild.memberCount}명`, inline: true },
                { name: '🚀 부스트 레벨', value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount}개 부스트)`, inline: true }
            )
            .setFooter({ text: `서버 ID: ${guild.id}` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }

    // 6. 랜덤 추첨 이벤트 기능 (관리자 전용)
    if (commandName === '추첨') {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: "❌ 이 명령어는 관리자만 사용할 수 있습니다.", ephemeral: true });
        }

        const prize = interaction.options.getString('상품');
        await interaction.guild.members.fetch();
        const humanMembers = interaction.guild.members.cache.filter(m => !m.user.bot);
        
        if (humanMembers.size === 0) {
            return interaction.reply({ content: "❌ 추첨할 대상이 없습니다.", ephemeral: true });
        }

        const winner = humanMembers.random();
        const embed = new MessageEmbed()
            .setTitle('🎁 실시간 이벤트 추첨 결과!')
            .setColor('#EB459E')
            .setDescription(`**상품:** ${prize}`)
            .addField('🎉 당첨자 축하드립니다!', `${winner.user} (${winner.user.tag})`, false)
            .setTimestamp();

        await interaction.reply({ content: "✨ 추첨을 완료했습니다!", ephemeral: true });
        return interaction.channel.send({ embeds: [embed] });
    }

    // 7. 관리자 공지 전송 기능
    if (commandName === '공지') {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: "❌ 이 명령어는 관리자만 사용할 수 있습니다.", ephemeral: true });
        }

        const content = interaction.options.getString('내용');
        const embed = new MessageEmbed()
            .setTitle('📢 서버 공식 공지사항')
            .setColor('#ED4245')
            .setDescription(content)
            .setFooter({ text: `${interaction.guild.name} 운영진`, iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ content: "📢 공지가 성공적으로 전송되었습니다.", ephemeral: true });
        return interaction.channel.send({ embeds: [embed] });
    }
}

module.exports = { handleCommand };