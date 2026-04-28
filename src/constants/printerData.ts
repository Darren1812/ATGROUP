// src/constants/printerData.ts

export const getImageForModelAndFunctions = (model: string, functions: string[]) => {
    if (!model) return "";

    // 29-series
    if (model.includes("29") && functions.includes("Inner"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/1`;
    if (model.includes("29"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/2`;

    // 49-series
    if (model.includes("49") && functions.includes("Inner"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/5`;
    if (model.includes("49") && functions.includes("Staple"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/6`;
    if (model.includes("49") && functions.includes("Booklet"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/4`;
    if (model.includes("49"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/3`;

    // 68-series
    if (model.includes("6870i") && functions.includes("Inner")) {
        return "Inner is not supported for C5870i";
    }
    if (
        model.includes("68") &&
        functions.includes("Inner") &&
        !model.includes("6870i")
    ) {
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/5`;
    } if (model.includes("68") && functions.includes("Staple"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/6`;
    if (model.includes("68") && functions.includes("Booklet"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/4`;
    if (model.includes("68"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/3`;

    // 58-series
    if (model.includes("C5870i") && functions.includes("Inner")) {
        return "Inner is not supported for C5870i";
    }

    if (
        model.includes("58") &&
        functions.includes("Inner") &&
        !model.includes("C5870i")
    ) {
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/5`;
    }
    if (model.includes("58") && functions.includes("Staple"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/6`;
    if (model.includes("58") && functions.includes("Booklet"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/4`;
    if (model.includes("58"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/3`;

    // 89-series
    if (model.includes("89") && functions.includes("Booklet"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/8`;
    if (model.includes("89") && functions.includes("Staple"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/9`;
    if (model.includes("89"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/7`;

    //39-series
    if (model.includes("39") && functions.includes("Inner"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/5`;
    if (model.includes("39") && functions.includes("Staple"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/6`;
    if (model.includes("39") && functions.includes("Booklet"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/4`;
    if (model.includes("39"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/3`;

    //C200-series
    if (model.includes("C2") && functions.includes("Staple"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/11`;
    if (model.includes("C2"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/10`;

    //C5100-series
    if (model.includes("51") && functions.includes("Inner"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/13`;
    if (model.includes("51") && functions.includes("Staple"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/14`;
    if (model.includes("51") && functions.includes("Booklet"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/15`;
    if (model.includes("51"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/12`;
    //C5100-series
    if (model.includes("61") && functions.includes("Inner"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/13`;
    if (model.includes("61") && functions.includes("Staple"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/14`;
    if (model.includes("61") && functions.includes("Booklet"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/15`;
    if (model.includes("61"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/12`;
    if (model.includes("16"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/16`;
    if (model.includes("22"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/18`;
    if (model.includes("55") && functions.includes("Inner"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/20`;
    if (model.includes("55") && functions.includes("Staple"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/22`;
    if (model.includes("55") && functions.includes("Booklet"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/21`;
    if (model.includes("55"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/19`;
    if (model.includes("35") && functions.includes("Inner"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/20`;
    if (model.includes("35") && functions.includes("Staple"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/22`;
    if (model.includes("35") && functions.includes("Booklet"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/21`;
    if (model.includes("35"))
        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/19`;

    return "";

};

export const modelSpeedMap: Record<string, string> = {
    "2925": "25ppm",
    "2930": "30ppm",
    "2935": "35ppm",
    "2945": "45ppm",
    "4925": "25ppm",
    "4935": "35ppm",
    "4945": "45ppm",
    "6855": "55ppm",
    "6860": "60ppm",
    "6870": "70ppm",
    "5840": "40ppm",
    "5850": "50ppm",
    "5860": "60ppm",
    "5870": "70ppm",
    "8986": "86ppm",
    "8995": "95ppm",
    "8905": "105ppm",
    "3935": "35ppm",
    "3930": "30ppm",
    "3926": "26ppm",
    "3922": "22ppm",
    "265": "65ppm",
    "270": "70ppm",
    "5140": "40ppm",
    "5150": "50ppm",
    "5160": "60ppm",
    "5170": "70ppm",
    "6155": "55ppm",
    "6160": "60ppm",
    "6170": "70ppm",
    "1643i": "43ppm",
    "1643iF": "43ppm",
    "2224": "24ppm",
    "2224N": "24ppm",
    "C5535i": "35ppm",
    "C5540i": "40ppm",
    "C5550i": "50ppm",
    "C5560i": "60ppm",
    "C3520i": "20ppm",
    "C3525i": "25ppm",
    "C3530i": "30ppm"
};

export const STAFF_NAMES = [
    "Darren Wong",
    "Boon Yee Kuan",
    "Aezattul Hannah Binti Abas",
    "Muhammad Syafiq Bin Kamarul Zaman",
    "Nur Izzati Binti Ya'Cob",
    "Husni Zaim Bin Ishak",
    "Keith Ee Tian Cheng",
    "Nurul Husna Binti Mohamed",
    "Sonia Lee",
    "Nik Mohd Azlan",
    "Alya Amran",
    "Khloe Wong"
];

export const ARENASTAFF_NAMES = [
    "NORAZIZAH BT ABDUL GHANI",
    "AKMAL BIN AMRAN",
    "MAZWAN BIN MOHAMAD"
];

export const SKYSTAFF_NAMES = [
    "MIRZA ADZREEM"
]

export const ASN_ADDRESS = [
    {
        name: "Johor",
        address:
            "B0514 Blok B, Eko Galleria,\nJalan Eko Botani 3,\nTaman Eko Botani,\n79100 Iskandar Puteri, Johor.",
    },
    {
        name: "Melaka",
        address:
            "No. 15-1, Jalan PNBBU 4,\nPusat Niaga Bukit Baru Utama,\n75150 Bukit Baru, Melaka.",
    },
    {
        name: "Kuala Lumpur",
        address:
            "No. 40, Suite 2, Jalan 30A/119,\nTaman Taynton View,\n56000 Kuala Lumpur.",
    },
    {
        name: "Pahang",
        address:
            "E-1732, Tingkat 1,\nJalan Dato’ Wong Ah Jang,\n25100 Kuantan, Pahang.",
    },
    {
        name: "Terengganu",
        address:
            "K-7752, Tingkat 1,\nTaman Bersekutu,\nJalan Kubang Kurus,\n24000 Kemaman, Terengganu.",
    },
    {
        name: "Kelantan",
        address:
            "PT 259, Tingkat 2,\nJalan Kebun Sultan, Seksyen 8,\n15350 Kota Bharu, Kelantan.",
    },
    {
        name: "Negeri Sembilan",
        address:
            "76-1 Suite 02,\nJalan Metro Sendayan 1/4,\nSendayan Metro Park Seremban,\n71950 Bandar Sri Sendayan, Negeri Sembilan.",
    },
];

export const ARENA_ADDRESS = [
    {
        name: "MELAKA",
        address:
            "ARENA STABIL SDN BHD (795045-D)\nNO. PENDAFTARAN: 200701037016 (795045-D)\nNO. 1194‐7, KAMPUNG PINANG TENGAH, BATANG TIGA, TANJUNG KELING,\n76400 MELAKA TENGAH, MELAKA.",
    },
    {
        name: "NEGERI SEMBILAN",
        address:
            "ARENA STABIL SDN BHD (795045-D)\nNO. 12, JALAN MELATI 1,\nDESA MELATI SEREMBAN, \n71800 BANDAR NILAI UTAMA, NEGERI SEMBILAN",
    },
    {
        name: "JOHOR",
        address:
            "ARENA STABIL SDN BHD\nNO. PENDAFTARAN: 795045-D\nN0.34, JALAN PUTRA 1, \nTAMAN SRI PUTRA,\n81200 JOHOR BAHRU, JOHOR.",
    },
    {
        name: "SELANGOR",
        address:
            "ARENA STABIL SDN BHD (795045-D)\n29 & 29A, LORONG SENTOSA 4A,\nTAMAN BAYU TINGGI,\n41200 KLANG,\nSELANGOR DARUL EHSAN",
    },
    {
        name: "PULAU PINANG",
        address:
            "ARENA STABIL SDN BHD (795045-D)\nNO. 47, LORONG TENANG 5,\nTAMAN TENANG,\nSEBERANG PERAI TENGAH,\n14000 BUKIT MERTAJAM, PULAU PINANG.",
    },
    {
        name: "PAHANG",
        address:
            "ARENA STABIL SDN BHD (795045-D)\n32, GROUND FLOOR,\nLORONG PANDAN DAMAI 2/201,\nJALAN GAMBANG,\n25152 KUANTAN, PAHANG",
    },
    {
        name: "TERENGGANU",
        address:
            "ARENA STABIL SDN BHD (795045-D)\n447-E/1, JALAN KAMARUDIN,\n20400 KUALA TERENGGANU,\nTERENGGANU",
    },{
        name: "KELANTAN",
        address:
            "ARENA STABIL SDN BHD (795045-D)\nLOT 1.41, KB CYBER PLAZA, KB MALL,\n15000 KOTA BAHRU,\nKELANTAN",
    },
];

export const MODEL_LIST = [
    {
        name: "2925i",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER 2925i",
    },
    {
        name: "2930i",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER 2930i",
    },
    {
        name: "2935i",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER 2935i",
    },
    {
        name: "2945i",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER 2945i",
    },
    {
        name: "4925i",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 4925i",
    },
    {
        name: "4935i",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 4935i",
    },
    {
        name: "4945i",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 4945i",
    },
    {
        name: "6855i",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 6855i",
    },
    {
        name: "6860i",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 6860i"
    },
    {
        name: "6870i",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 6870i"
    },
    {
        name: "C5840i",
        fullName: "Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C5840i",
    },
    {
        name: "C5850i",
        fullName: "Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C5850i",
    },
    {
        name: "C5860i",
        fullName: "Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C5860i"
    },
    {
        name: "C5870i",
        fullName: "Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C5870i"
    },
    {
        name: "8986",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 8986",
    },
    {
        name: "8995",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 8995"
    },
    {
        name: "8905",
        fullName: "Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 8905"
    },
    {
        name: "C3935i",
        fullName: "Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C3935i"
    },
    {
        name: "C3930i",
        fullName: "Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C3930i",
    },
    {
        name: "C3926i",
        fullName: "Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C3926i"
    },
    {
        name: "C3922i",
        fullName: "Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C3922i"
    },
    {
        name: "C265",
        fullName: "Canon Color Multi-Function Printer imagePRESS C265"
    },
    {
        name: "C270",
        fullName: "Canon Color Multi-Function Printer imagePRESS C270"
    },
    {
        name: "C5140",
        fullName: "Canon Color Multi-Function Printer Canon imageFORCE C5140"
    },
    {
        name: "C5150",
        fullName: "Canon Color Multi-Function Printer Canon imageFORCE C5150"
    },
    {
        name: "C5160",
        fullName: "Canon Color Multi-Function Printer Canon imageFORCE C5160"
    },
    {
        name: "C5170",
        fullName: "Canon Color Multi-Function Printer Canon imageFORCE C5170"
    },
    {
        name: "6155",
        fullName: "Canon Mono Multi-Function Printer Canon imageFORCE 6155"
    },
    {
        name: "6160",
        fullName: "Canon Mono Multi-Function Printer Canon imageFORCE 6160"
    },
    {
        name: "6170",
        fullName: "Canon Mono Multi-Function Printer Canon imageFORCE 6170"
    },
    {
        name: "1643i",
        fullName: "Canon Mono Multi-Function Printer Canon imageRUNNER 1643i II"
    },
    {
        name: "1643iF",
        fullName: "Canon Mono Multi-Function Printer Canon imageRUNNER 1643iF II"
    },
    {
        name: "2224",
        fullName: "Canon Mono Multi-Function Printer Canon imageRUNNER 2224"
    },
    {
        name: "2224N",
        fullName: "Canon Mono Multi-Function Printer Canon imageRUNNER 2224N"
    },
    {
        name: "C5535i",
        fullName: "Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C5535i"
    },
    {
        name: "C5540i",
        fullName: "Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C5540i"
    },
    {
        name: "C5550i",
        fullName: "Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C5550i"
    },
    {
        name: "C5560i",
        fullName: "Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C5535i"
    },
    {
        name: "C3520i",
        fullName: "Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C3520i"
    },
    {
        name: "C3525i",
        fullName: "Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C3525i"
    },
    {
        name: "C3530i",
        fullName: "Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C3530i"
    },
];

export const catalog = [
    {
        series: "2900 Series",
        seriesImages: [
            { id: 2, label: "STANDARD" },
            { id: 1, label: "WITH INNER FINISHER" }
        ],
        products: [
            { id: 1, name: 'Canon Mono Multi-Function Printer imageRUNNER 2925i', price: 'Mono Multi-Function' },
            { id: 2, name: 'Canon Mono Multi-Function Printer imageRUNNER 2930i', price: 'Mono Multi-Function' },
            { id: 3, name: 'Canon Mono Multi-Function Printer imageRUNNER 2935i', price: 'Mono Multi-Function' },
            { id: 4, name: 'Canon Mono Multi-Function Printer imageRUNNER 2945i', price: 'Mono Multi-Function' },
        ]
    },
    {
        series: "4900 Series",
        seriesImages: [
            { id: 3, label: "STANDARD" },
            { id: 5, label: "WITH INNER FINISHER" },
            { id: 4, label: "WITH BOOKLET FINISHER" },
            { id: 6, label: "WITH STAPLE FINISHER" }
        ],
        products: [
            { id: 5, name: 'Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 4925i', price: 'Color Multi-Function' },
            { id: 6, name: 'Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 4935i', price: 'Color Multi-Function' },
            { id: 7, name: 'Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 4945i', price: 'Color Multi-Function' },
        ]
    },
    {
        series: "6800 Series",
        seriesImages: [
            { id: 3, label: "STANDARD" },
            { id: 5, label: "WITH INNER FINISHER" },
            { id: 4, label: "WITH BOOKLET FINISHER" },
            { id: 6, label: "WITH STAPLE FINISHER" }
        ],
        products: [
            { id: 8, name: 'Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 6855i', price: 'Compact Mono' },
            { id: 9, name: 'Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 6860i', price: 'Compact Mono' },
            { id: 10, name: 'Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 6870i', price: 'Compact Mono' },
        ]
    },
    {
        series: "C5800 Series",
        seriesImages: [
            { id: 3, label: "STANDARD" },
            { id: 5, label: "WITH INNER FINISHER" },
            { id: 4, label: "WITH BOOKLET FINISHER" },
            { id: 6, label: "WITH STAPLE FINISHER" }
        ],
        products: [
            { id: 11, name: 'Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C5840i', price: 'Color Multi-Function' },
            { id: 12, name: 'Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C5850i', price: 'Color Multi-Function' },
            { id: 13, name: 'Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C5860i', price: 'Color Multi-Function' },
            { id: 14, name: 'Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C5870i', price: 'Color Multi-Function' },
        ],
    },
    {
        series: "8900 Series",
        seriesImages: [
            { id: 7, label: "STANDARD" },
            { id: 8, label: "WITH BOOKLET FINISHER" },
            { id: 9, label: "WITH STAPLE FINISHER" }
        ],
        products: [
            { id: 11, name: 'Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 8986', price: 'Color Multi-Function' },
            { id: 12, name: 'Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 8995', price: 'Color Multi-Function' },
            { id: 13, name: 'Canon Mono Multi-Function Printer imageRUNNER ADVANCE DX 8905', price: 'Color Multi-Function' },
        ],
    },
    {
        series: "C3900i Series",
        seriesImages: [
            { id: 3, label: "STANDARD" },
            { id: 5, label: "WITH INNER FINISHER" },
            { id: 4, label: "WITH BOOKLET FINISHER" },
            { id: 6, label: "WITH STAPLE FINISHER" }
        ],
        products: [
            { id: 14, name: 'Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C3922i', price: 'Color Multi-Function' },
            { id: 15, name: 'Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C3926i', price: 'Color Multi-Function' },
            { id: 16, name: 'Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C3930i', price: 'Color Multi-Function' },
            { id: 17, name: 'Canon Color Multi-Function Printer imageRUNNER ADVANCE DX C3935i', price: 'Color Multi-Function' },
        ],
    },
    {
        series: "C200 Series",
        seriesImages: [
            { id: 10, label: "STANDARD" },
            { id: 11, label: "-" }
        ],
        products: [
            { id: 18, name: 'Canon Color Multi-Function Printer imagePRESS C265', price: 'Color Multi-Function' },
            { id: 19, name: 'Canon Color Multi-Function Printer imagePRESS C270', price: 'Color Multi-Function' },
        ],
    },
    {
        series: "C5100 Series",
        seriesImages: [
            { id: 12, label: "Standard" },
            { id: 13, label: "WITH INNER FINISHER" },
            { id: 14, label: "WITH STAPLE FINISHER" },
            { id: 15, label: "WITH BOOKLET FINISHER" }
        ],
        products: [
            { id: 20, name: 'Canon Color Multi-Function Printer Canon imageFORCE C5140', price: 'Color Multi-Function' },
            { id: 21, name: 'Canon Color Multi-Function Printer Canon imageFORCE C5150', price: 'Color Multi-Function' },
            { id: 22, name: 'Canon Color Multi-Function Printer Canon imageFORCE C5160', price: 'Color Multi-Function' },
            { id: 23, name: 'Canon Color Multi-Function Printer Canon imageFORCE C5170', price: 'Color Multi-Function' },
        ],
    },
    {
        series: "6100 Series",
        seriesImages: [
            { id: 12, label: "Standard" },
            { id: 13, label: "WITH INNER FINISHER" },
            { id: 14, label: "WITH STAPLE FINISHER" },
            { id: 15, label: "WITH BOOKLET FINISHER" }
        ],
        products: [
            { id: 24, name: 'Canon Mono Multi-Function Printer Canon imageFORCE 6155', price: 'Color Multi-Function' },
            { id: 25, name: 'Canon Mono Multi-Function Printer Canon imageFORCE 6160', price: 'Color Multi-Function' },
            { id: 26, name: 'Canon Mono Multi-Function Printer Canon imageFORCE 6170', price: 'Color Multi-Function' },
        ],
    },
    {
        series: "1600i II Series",
        seriesImages: [
            { id: 16, label: "Standard Configuration" }
        ],
        products: [
            { id: 27, name: 'Canon Mono Multi-Function Printer Canon imageRUNNER 1643i II', price: 'Color Multi-Function' },
            { id: 28, name: 'Canon Mono Multi-Function Printer Canon imageRUNNER 1643iF II', price: 'Color Multi-Function' },
        ],
    },
    {
        series: "2200 Series",
        seriesImages: [
            { id: 18, label: "Standard" }
        ],
        products: [
            { id: 29, name: 'Canon Mono Multi-Function Printer Canon imageRUNNER 2224', price: 'Color Multi-Function' },
            { id: 30, name: 'Canon Mono Multi-Function Printer Canon imageRUNNER 2224N', price: 'Color Multi-Function' },
        ],
    },
    {
        series: "C5500i Series",
        seriesImages: [
            { id: 19, label: "Standard" },
            { id: 20, label: "WITH INNER FINISHER" },
            { id: 21, label: "WITH BOOKLET FINISHER" },
            { id: 22, label: "WITH STAPLE FINISHER" }
        ],
        products: [
            { id: 31, name: 'Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C5535i', price: 'Color Multi-Function' },
            { id: 32, name: 'Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C5540i', price: 'Color Multi-Function' },
            { id: 33, name: 'Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C5550i', price: 'Color Multi-Function' },
            { id: 34, name: 'Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C5560i', price: 'Color Multi-Function' },
        ],
    },
    {
        series: "C3500i Series",
        seriesImages: [
            { id: 19, label: "Standard" },
            { id: 20, label: "WITH INNER FINISHER" },
            { id: 21, label: "WITH BOOKLET FINISHER" },
            { id: 22, label: "WITH STAPLE FINISHER" }
        ],
        products: [
            { id: 31, name: 'Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C3520i', price: 'Color Multi-Function' },
            { id: 32, name: 'Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C3525i', price: 'Color Multi-Function' },
            { id: 33, name: 'Canon Color Multi-Function Printer Canon imageRUNNER ADVANCE C3530i', price: 'Color Multi-Function' },
        ],
    },
];

export const DEFAULT_FUNCTIONS = ["Copy", "Print", "Scan", "Store", "Email", "Send"];
