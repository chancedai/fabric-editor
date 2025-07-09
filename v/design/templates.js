const templates = [
  {
    title: "综合",
    type: "misc",
    // link:misc/tmpl22
    // cover:misc/tmpl22.jpg
    linkTmpl: "misc/tmpl_${id}",
    coverTmpl: "misc/tmpl_${id}.jpg",
    items: [
      "22",
      "46",
      "06",
      "34",
      "13",
      "01",
      "15",
      "28",
      "04",
      "26",
      "10",
      "33",
      "16",
      "37",
      "19",
      "35",
      "56",
      "17",
      "44",
      "32",
      "39",
      "30",
      "58",
      "54",
      "29",
      "51",
      "09",
      "12",
      "08",
      "03",
      "25",
      "41",
      "23",
      "47",
      "55",
      "40",
      "05",
      "20",
      "43",
      "02",
      "18",
      "14",
      "36",
      "27",
      "42",
      "21",
      "31",
      "53",
      "07",
      "38",
      "48",
      "50",
      "57",
      "24",
      "11",
      "49",
      "45",
      "52",
    ],
  },
  {
    title: "横幅",
    type: "banners",

    items: [
      {
        title: "空白",
        type: "blank",
        // link: banners/Blank/blank_728_90
        // cover: banners/Blank/blank_728_90.jpg
        linkTmpl: "banners/Blank/blank_${id}",
        coverTmpl: "banners/Blank/blank_${id}.jpg",
        items: [
          "728_90",
          "160_600",
          "120_600",
          "468_60",
          "320_50",
          "336_280",
          "300_250",
        ],
      },
      {
        title: "生态光",
        type: "EcoLight",
        // link: banners/EcoLight/EcoLightSolutions_728_90
        // cover: banners/EcoLight/EcoLightSolutions_728_90.jpg
        linkTmpl: "banners/EcoLight/EcoLightSolutions_${id}",
        coverTmpl: "banners/EcoLight/EcoLightSolutions_${id}.jpg",
        items: [
          "728_90",
          "160_600",
          "120_600",
          "468_60",
          "320_50",
          "336_280",
          "300_250",
        ],
      },
      {
        title: "自然有机",
        type: "NatureOrganics",
        // link: banners/NatureOrganics/NatureOrganics_728_90
        // cover: banners/NatureOrganics/NatureOrganics_728_90.jpg
        linkTmpl: "banners/NatureOrganics/NatureOrganics_${id}",
        coverTmpl: "banners/NatureOrganics/NatureOrganics_${id}.jpg",
        items: [
          "728_90",
          "160_600",
          "120_600",
          "468_60",
          "320_50",
          "336_280",
          "300_250",
        ],
      },
      {
        title: "NutriBlend",
        type: "NutriBlend",
        // link: banners/NutriBlend/NutriBlend_728_90
        // cover: banners/NutriBlend/NutriBlend_728_90.jpg
        linkTmpl: "banners/NutriBlend/NutriBlend_${id}",
        coverTmpl: "banners/NutriBlend/NutriBlend_${id}.jpg",
        items: [
          "728_90",
          "160_600",
          "120_600",
          "468_60",
          "320_50",
          "336_280",
          "300_250",
        ],
      },
      {
        title: "SkylineBuilders",
        type: "SkylineBuilders",
        // link: banners/SkylineBuilders/SkylineBuilders_728_90
        // cover: banners/SkylineBuilders/SkylineBuilders_728_90.jpg
        linkTmpl: "banners/SkylineBuilders/SkylineBuilders_${id}",
        coverTmpl: "banners/SkylineBuilders/SkylineBuilders_${id}.jpg",
        items: [
          "728_90",
          "160_600",
          "120_600",
          "468_60",
          "320_50",
          "336_280",
          "300_250",
        ],
      },
      {
        title: "SolarisTech",
        type: "SolarisTech",
        // link: banners/SolarisTech/SolarisTech_728_90
        // cover: banners/SolarisTech/SolarisTech_728_90.jpg
        linkTmpl: "banners/SolarisTech/SolarisTech_${id}",
        coverTmpl: "banners/SolarisTech/SolarisTech_${id}.jpg",
        items: [
          "728_90",
          "160_600",
          "120_600",
          "468_60",
          "320_50",
          "336_280",
          "300_250",
        ],
      },
    ],
  },
  {
    title: "生日",
    type: "birthdayCards",
    items: [
      {
        title: "空白",
        type: "empty",
        // link: birthdayCards/Portrait/BD_portrait_1200_1800
        // cover: birthdayCards/Portrait/BD_portrait_1200_1800.jpg
        linkTmpl: "birthdayCards/${id}",
        coverTmpl: "birthdayCards/${id}.jpg",
        items: [
          "Portrait/BD_portrait_1200_1800",
          "Square/BD_square_1200_1200",
          "Landscape/BD_landscape_1800_1200",
        ],
      },
      {
        title: "竖版",
        type: "portrait",
        // link: birthdayCards/Portrait/BD_card_004
        // cover: birthdayCards/Portrait/BD_card_004.jpg
        linkTmpl: "birthdayCards/Portrait/BD_card_${id}",
        coverTmpl: "birthdayCards/Portrait/BD_card_${id}.jpg",
        items: [
          "004",
          "005",
          "006",
          "007",
          "008",
          "009",
          "010",
          "018",
          "024",
          "025",
        ],
      },
      {
        title: "方形",
        type: "square",
        // link: birthdayCards/Square/BD_card_002
        // cover: birthdayCards/Square/BD_card_002.jpg
        linkTmpl: "birthdayCards/Square/BD_card_${id}",
        coverTmpl: "birthdayCards/Square/BD_card_${id}.jpg",
        items: ["002", "003", "013", "014", "015", "023"],
      },
      {
        title: "横版",
        type: "landscape",
        // link: birthdayCards/Landscape/BD_card_001
        // cover: birthdayCards/Landscape/BD_card_001.jpg
        linkTmpl: "birthdayCards/Landscape/BD_card_${id}",
        coverTmpl: "birthdayCards/Landscape/BD_card_${id}.jpg",
        items: ["001", "011", "012", "016", "017", "019", "020", "021", "022"],
      },
    ],
  },
  {
    title: "圣诞",
    type: "christmasCards",
    items: [
      {
        title: "空白",
        type: "empty",
        // link: christmasCards/Portrait/christmas-card_portrait_1200_1800
        // cover: christmasCards/Portrait/christmas-card_portrait_1200_1800.jpg
        linkTmpl: "christmasCards/${id}",
        coverTmpl: "christmasCards/${id}.jpg",
        items: [
          "Portrait/christmas-card_portrait_1200_1800",
          "Square/christmas-card_square_1200_1200",
          "Landscape/christmas-card_landscape_1800_1200",
        ],
      },
      {
        title: "竖版",
        type: "portrait",
        // link: christmasCards/Portrait/001_christmas_poster
        // cover: christmasCards/Portrait/001_christmas_poster.jpg
        linkTmpl: "christmasCards/Portrait/${id}_christmas_poster",
        coverTmpl: "christmasCards/Portrait/${id}_christmas_poster.jpg",
        items: [
          "001",
          "002",
          "006",
          "007",
          "009",
          "010",
          "016",
          "018",
          "019",
          "014",
          "020",
        ],
      },
      {
        title: "方形",
        type: "square",
        // link: christmasCards/Square/003_christmas_poster
        // cover: christmasCards/Square/003_christmas_poster.jpg
        linkTmpl: "christmasCards/Square/${id}_christmas_poster",
        coverTmpl: "christmasCards/Square/${id}_christmas_poster.jpg",
        items: ["003", "004", "005", "011", "012", "013", "017"],
      },
      {
        title: "横版",
        type: "landscape",
        // link: christmasCards/Landscape/008_christmas_poster
        // cover: christmasCards/Landscape/008_christmas_poster.jpg
        linkTmpl: "christmasCards/Landscape/${id}_christmas_poster",
        coverTmpl: "christmasCards/Landscape/${id}_christmas_poster.jpg",
        items: ["008", "015"],
      },
    ],
  },
  {
    title: "感谢",
    type: "greetingCards",
    items: [
      {
        title: "空白",
        type: "empty",
        // link: greetingCards/Portrait/greeting-card_portrait_1200_1800
        // cover: greetingCards/Portrait/greeting-card_portrait_1200_1800.jpg
        linkTmpl: "greetingCards/${id}",
        coverTmpl: "greetingCards/${id}.jpg",
        items: [
          "Portrait/greeting-card_portrait_1200_1800",
          "Landscape/greeting-card_landscape_1800_1200",
        ],
      },
      {
        title: "竖版",
        type: "portrait",
        // link: greetingCards/Portrait/001_thankyou_poster
        // cover: greetingCards/Portrait/001_thankyou_poster.jpg
        linkTmpl: "greetingCards/Portrait/${id}",
        coverTmpl: "greetingCards/Portrait/${id}.jpg",
        items: [
          "amsterdam_poster_02",
          "bangkok_poster_02",
          "berlin_poster_02",
          "egypt_poster_02",
          "hongkong_poster_02",
          "istanbul_poster_01",
          "istanbul_poster_02",
          "japan_poster_01",
          "lisbon_poster_01",
          "NY_poster_02",
          "paris_poster_01",
          "prague_poster_01",
          "rome_poster_02",
          "sanfrancisco_poster_01",
        ],
      },
      {
        title: "方形",
        type: "landscape",
        // link: greetingCards/Landscape/002_thankyou_poster
        // cover: greetingCards/Landscape/002_thankyou_poster.jpg
        linkTmpl: "greetingCards/Landscape/${id}",
        coverTmpl: "greetingCards/Landscape/${id}.jpg",
        items: [
          "amsterdam_poster_01",
          "bangkok_poster_01",
          "berlin_poster_01",
          "egypt_poster_01",
          "holland_poster",
          "hongkong_poster_01",
          "japan_poster_02",
          "london_poster_01",
          "london_poster_02",
          "london_poster_03",
          "NY_poster_01",
          "paris_poster_02",
          "rome_poster_01",
        ],
      },
    ],
  },
  {
    title: "节日",
    type: "holidayCards",
    items: [
      {
        title: "空白",
        type: "empty",
        // link: holidayCards/Portrait/holiday-card_portrait_1200_1800
        // cover: holidayCards/Portrait/holiday-card_portrait_1200_1800.jpg
        linkTmpl: "holidayCards/${id}",
        coverTmpl: "holidayCards/${id}.jpg",
        coverTmpl: "holidayCards/${id}.jpg",
        items: [
          "Portrait/holiday-card_portrait_1200_1800",
          "Square/holiday-card_square_1200_1200",
          "Landscape/holiday-card_landscape_1800_1200",
        ],
      },
      {
        title: "竖版",
        type: "portrait",
        // link: holidayCards/Portrait/001_holiday_valentineday
        // cover: holidayCards/Portrait/001_holiday_valentineday.jpg
        linkTmpl: "holidayCards/Portrait/${id}",
        coverTmpl: "holidayCards/Portrait/${id}.jpg",
        items: [
          "001_holiday_valentineday",
          "002_holiday_valentineday",
          "003_holiday_valentineday",
          "004_holiday_womenday",
          "007_holiday_patrickday",
          "008_holiday_patrickday",
          "011_holiday_mubarak_01",
          "013_holiday_easter",
          "014_holiday_easter",
          "015_holiday_easter",
          "016_holiday_diwali_poster",
          "017_holiday_diwali_poster",
          "018_holiday_diwali_poster",
          "021_holiday_hanukkah_poster",
          "022_holiday_halloween_poster",
          "024_holiday_halloween_poster",
          "025_holiday_fathersday_poster",
          "027_holiday_fathersday_poster",
          "028_holiday_thanksgiving_poster",
          "029_holiday_thanksgiving_poster",
          "031_holiday_4thofjuly_poster",
          "032_holiday_4thofjuly_poster",
          "038_holiday_momiji_poster",
          "040_holiday_hinamatsuri_poster",
        ],
      },
      {
        title: "方形",
        type: "square",
        // link: holidayCards/Square/010_holiday_patrickday
        // cover: holidayCards/Square/010_holiday_patrickday.jpg
        linkTmpl: "holidayCards/Square/${id}",
        coverTmpl: "holidayCards/Square/${id}.jpg",
        items: [
          "010_holiday_patrickday",
          "020_holiday_hanukkah_poster",
          "023_holiday_halloween_poster",
          "026_holiday_fathersday_poster",
          "030_holiday_Thanksgiving_poster",
          "034_holiday_Mothersday_poster",
          "036_holiday_hanami_poster",
          "037_holiday_hanami_poster",
          "039_holiday_hinamajuri_poster",
        ],
      },
      {
        title: "横版",
        type: "landscape",
        // link: holidayCards/Landscape/005_holiday_womenday
        // cover: holidayCards/Landscape/005_holiday_womenday.jpg
        linkTmpl: "holidayCards/Landscape/${id}",
        coverTmpl: "holidayCards/Landscape/${id}.jpg",
        items: [
          "005_holiday_womenday",
          "006_holiday_womenday",
          "009_holiday_patrickday",
          "012_holiday_mubarak",
          "019_holiday_hanukkah_poster",
          "033_holiday_4thofjuly_poster",
          "035_holiday_Mothersday_poster",
        ],
      },
    ],
  },
  {
    title: "名片",
    type: "businessCards",
    items: [
      {
        title: "空白",
        type: "empty",
        // link: businessCards/Landscape/BC_landscape_1050_600
        // cover: businessCards/Landscape/BC_landscape_1050_600.jpg
        linkTmpl: "businessCards/${id}",
        coverTmpl: "businessCards/${id}.jpg",
        items: ["Landscape/BC_landscape_1050_600"],
      },
      {
        title: "横版",
        type: "landscape",
        // link: businessCards/Landscape/BC_01_nutriblend
        // cover: businessCards/Landscape/BC_01_nutriblend.jpg
        linkTmpl: "businessCards/Landscape/BC_${id}",
        coverTmpl: "businessCards/Landscape/BC_${id}.jpg",
        items: [
          "BC_01_nutriblend",
          "BC_02_ecolightsolutions",
          "BC_03_ecolightsolutions",
          "BC_04_ecolightsolutions",
          "BC_05_skylinebuilders",
          "BC_06_skylinebuilders",
          "BC_07_skylinebuilders",
          "BC_08_nutriblend",
          "BC_09_nutriblend",
          "BC_10_nutriblend",
          "BC_11_solaristech",
          "BC_12_blossomboutique",
          "BC_13_skyline",
          "BC_14_skyline",
          "BC_15_ecoligthsolutions",
          "BC_16_ecoligthsolutions",
          "BC_17_blossomboutigue",
          "BC_18_blossomboutigue",
          "BC_19_skyline",
          "BC_20_skyline",
          "BC_21_littlecareclinic",
          "BC_22_painting",
          "BC_23_skyline",
          "BC_24_skyline",
          "BC_25_blossomboutique",
          "BC_26_trailblaze",
          "BC_27_trailblaze",
          "BC_28_trailblaze",
          "BC_30_blossom",
          "BC_02_ecolightsolutions",
        ],
      },
    ],
  },
  {
    title: "名言",
    type: "quoteCards",
    items: [
      {
        title: "空白",
        type: "empty",
        // link: quoteCards/Portrait/quote_portrait_1200_1800
        // cover: quoteCards/Portrait/quote_portrait_1200_1800.jpg
        linkTmpl: "quoteCards/${id}",
        coverTmpl: "quoteCards/${id}.jpg",
        items: [
          "Portrait/quote_portrait_1200_1800",
          "Square/quote_square_1200_1200",
          "Landscape/quote_landscape_1800_1200",
        ],
      },
      {
        title: "方形",
        type: "square",
        // link: quoteCards/Square/Aim_for_the_moon
        // cover: quoteCards/Square/Aim_for_the_moon.png
        linkTmpl: "quoteCards/Square/${id}",
        coverTmpl: "quoteCards/Square/${id}.png",
        items: [
          "Aim_for_the_moon",
          "Alexandra_Stoddard_-_Slow_down",
          "CS_Lewis-You_cant_go_back_and_change_the_beginning",
          "Dont_climb_mountains_so_the_world_can_see_you",
          "dont_try_to_rush_things",
          "Falling_down_is_an_accident",
          "Forget_all_the_reasons_why_it_wouldnt_work",
          "Hippocrates_-_Walking_is_a_mans_best_medicine",
          "I_am_not_rude",
          "I_didnt_want_memories_I_wanted_you",
          "If_you_feel_like_you_are_losing_everything",
          "if_you_judge_a_book_by_its_cover",
          "if_your_life_was_a_book",
          "Its_not_happy_people_who_are_thankful",
          "Love_is_not_about_how_much_you_say_I_love_you",
          "Love_is_sweet_when_it_is_new",
          "Najwa_Zebian-Dont_break_a_birds_wing_and_then_tell_it_to_fly",
          "no_matter_how_slow_you_walk",
          "not_everyone_you_lose_is_a_loss",
          "only_an_open_heart",
          "People_who_do_not_understand_your_silence",
          "popcorn_is_prepared_in_the_same_pot",
          "Ragnar_Lodbrok_-_Dont_waste_your_time_looking_back",
          "real_friend_talk_shit_to_your_face",
          "Sometimes_all_you_need_is_a_hug",
          "sometimes_all_you_need_is_good_company",
          "stop_chasing_the_wrong_one",
          "the_best_thing_in_life_is_finding_someone",
          "the_small_things_you_do_for_someone_else",
          "the_trick_is_to_care_about_everyone",
          "To_be_a_winner_you_have_to_give_is_all_you_have",
          "To_be_the_best",
          "what_you_need_and_want",
          "When_you_love_what_you_have_you_have_everything_you_need",
          "Winners_never_quit",
          "you_dont_have_to_be_strong_to_hold_on_to_something",
          "Your_sorry_is_useless_when_my_trust_is_broken",
          "Your_wings_already_exist",
        ],
      },
      {
        title: "横版",
        type: "lanscape",
        // link: quoteCards/Landscape/Albert_Einstein_-_If_you_cant_explain_it_simply
        // cover: quoteCards/Landscape/Albert_Einstein_-_If_you_cant_explain_it_simply.png
        linkTmpl: "quoteCards/Landscape/${id}",
        coverTmpl: "quoteCards/Landscape/${id}.png",
        items: [
          "Albert_Einstein_-_If_you_cant_explain_it_simply",
          "for_every_minute_you_are_angry",
        ],
      },
    ],
  },
];

function getCompleteTemplates() {
  function processItems(category) {
    return category.items.map((id) => ({
      id,
      link: category.linkTmpl.replace("${id}", id),
      cover: category.coverTmpl.replace("${id}", id),
    }));
  }

  function processCategory(category) {
    if (category.items[0] && typeof category.items[0] === "object") {
      return {
        ...category,
        items: category.items.map((sub) => ({
          ...sub,
          items: processItems(sub),
        })),
      };
    } else {
      return {
        ...category,
        items: processItems(category),
      };
    }
  }

  return templates.map(processCategory);
}

// 获取完整数据
const completeTemplates = getCompleteTemplates();

