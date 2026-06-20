import Svg, { Circle, Rect, Text as SvgText } from "react-native-svg";
import type { PaymentMethod } from "../../utils/checkoutApi";

type Props = {
  method: PaymentMethod;
  size?: number;
};

/** Brand-styled payment marks for the checkout grid (not generic phone icons). */
export function PaymentMethodIcon({ method, size = 44 }: Props) {
  switch (method) {
    case "mtn_momo":
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Rect width={48} height={48} rx={10} fill="#FFCC00" />
          <SvgText
            x={24}
            y={30}
            fill="#000000"
            fontSize={13}
            fontWeight="700"
            textAnchor="middle"
            fontFamily="Inter"
          >
            MTN
          </SvgText>
        </Svg>
      );

    case "orange_money":
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Rect width={48} height={48} rx={10} fill="#FF7900" />
          <SvgText
            x={24}
            y={22}
            fill="#FFFFFF"
            fontSize={11}
            fontWeight="700"
            textAnchor="middle"
            fontFamily="Inter"
          >
            Orange
          </SvgText>
          <SvgText
            x={24}
            y={34}
            fill="#FFFFFF"
            fontSize={9}
            fontWeight="600"
            textAnchor="middle"
            fontFamily="Inter"
          >
            Money
          </SvgText>
        </Svg>
      );

    case "express_union":
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Rect width={48} height={48} rx={10} fill="#1E3A8A" />
          <SvgText
            x={24}
            y={22}
            fill="#FFFFFF"
            fontSize={10}
            fontWeight="700"
            textAnchor="middle"
            fontFamily="Inter"
          >
            Express
          </SvgText>
          <SvgText
            x={24}
            y={34}
            fill="#FFFFFF"
            fontSize={10}
            fontWeight="700"
            textAnchor="middle"
            fontFamily="Inter"
          >
            Union
          </SvgText>
        </Svg>
      );

    case "card":
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Rect width={48} height={48} rx={10} fill="#F3F4F6" />
          <Rect x={6} y={14} width={36} height={22} rx={4} fill="#1F2937" />
          <Rect x={6} y={20} width={36} height={6} fill="#374151" />
          <Circle cx={34} cy={28} r={5} fill="#EB001B" opacity={0.95} />
          <Circle cx={38} cy={28} r={5} fill="#F79E1B" opacity={0.95} />
          <SvgText
            x={12}
            y={31}
            fill="#FFFFFF"
            fontSize={7}
            fontWeight="700"
            fontFamily="Inter"
          >
            VISA
          </SvgText>
        </Svg>
      );

    default:
      return null;
  }
}
