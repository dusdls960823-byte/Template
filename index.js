const { Client, Intents, REST, Routes } = require('discord.js');
const { handleCommand } = require('./handlers/commands');
const { handleDiceCommand } = require('./handlers/dice');

const client = new Client({ 
    intents: [ 
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_MEMBERS 
    ] 
});

const TOKEN = 'YOUR_BOT_TOKEN_HERE';

// 슬래시 명령어 구조 전체 정의
const commandsData = [
    { name: '명령어', description: '커뮤니티 이벤트 및 편의 기능 안내를 확인합니다.' },
    { name: '출석체크', description: '매일 출석하고 포인트를 받으세요!' },
    { name: '포인트', description: '내 보유 포인트를 확인합니다.' },
    { name: '랭킹', description: '서버 내 포인트 보유 상위 랭킹을 확인합니다.' },
    { name: '서버정보', description: '현재 디스코드 서버의 상세 정보를 확인합니다.' },
    { 
        name: '주사위', 
        description: '1~6 주사위를 굴리거나 다른 유저와 PVP 대결을 합니다.',
        options: [
            {
                name: '굴리기',
                type: 1, 
                description: '1~6 주사위를 굴립니다. (포인트를 걸 수 있습니다)',
                options: [{
                    name: '포인트',
                    type: 4, 
                    description: '걸 포인트를 입력하세요 (선택사항)',
                    required: false
                }]
            },
            {
                name: '대결',
                type: 1, 
                description: '다른 유저와 포인트를 걸고 1:1 주사위 대결을 신청합니다.',
                options: [
                    {
                        name: '상대',
                        type: 6, 
                        description: '대결할 상대를 지목하세요.',
                        required: true
                    },
                    {
                        name: '포인트',
                        type: 4, 
                        description: '걸 포인트를 입력하세요.',
                        required: true
                    }
                ]
            }
        ]
    },
    { 
        name: '추첨', 
        description: '(관리자용) 현재 채널에서 랜덤으로 당첨자를 뽑습니다.',
        options: [{
            name: '상품',
            type: 3, 
            description: '추첨할 상품명을 입력하세요.',
            required: true
        }]
    },
    { 
        name: '공지', 
        description: '(관리자용) 멋진 임베드 공지를 보냅니다.',
        options: [{
            name: '내용',
            type: 3, 
            description: '공지할 내용을 입력하세요.',
            required: true
        }]
    }
];

client.once('ready', async () => {
    console.log(`[EventBot] 로그인 완료: ${client.user.tag}`);
    client.user.setActivity('/명령어 로 커뮤니티 이벤트 참여!', { type: 'PLAYING' });

    const rest = new REST({ version: '9' }).setToken(TOKEN);

    try {
        console.log('슬래시 명령어(/) 등록 중...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commandsData },
        );
        console.log('슬래시 명령어(/) 등록 완료!');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === '주사위') {
        await handleDiceCommand(interaction);
    } else {
        await handleCommand(interaction);
    }
});

client.login(TOKEN);