# /assets  —  PNG силуэттер

Осы қалтаға барлық PNG файлдарды сақтаңыз.

## Файл атаулары (content.json-мен сәйкес болуы керек)

| Объект  | Сурет            | Тень               |
|---------|------------------|--------------------|
| ball    | ball.png         | shadow_ball.png    |
| car     | car.png          | shadow_car.png     |
| tree    | tree.png         | shadow_tree.png    |
| house   | house.png        | shadow_house.png   |
| star    | star.png         | shadow_star.png    |
| rabbit  | hand_rabbit.png  | shadow_rabbit.png  |
| bird    | hand_bird.png    | shadow_bird.png    |
| dog     | hand_dog.png     | shadow_dog.png     |
| fox     | hand_fox.png     | shadow_fox.png     |

## PNG дайындау ережелері

**Объект суреті (image)**
- Мөлдір фон (PNG + alpha)
- Кез келген өлшем (256×256 немесе 512×512 ұсынылады)

**Тень силуэті (shadow)**
- Мөлдір фон
- Тек қара (#000) немесе өте күңгірт пиксельдер
- Объект пішінімен дәл сәйкес болуы керек

## Жаңа объект қосу

1. PNG файлдарды осы қалтаға салыңыз
2. `data/content.json` ішіне жаза жазыңыз:

```json
{
  "name":   "myobject",
  "label":  "Менің объектім",
  "emoji":  "🎸",
  "image":  "assets/myobject.png",
  "shadow": "assets/shadow_myobject.png",
  "shape":  "myobject"
}
```

3. "JSON жүктеу" батырмасы арқылы жаңа content.json жүктеңіз

> PNG файлдары жоқ болса, жүйе автоматты түрде canvas-пен сызылған
> силуэтті резервтік кескін ретінде пайдаланады.
