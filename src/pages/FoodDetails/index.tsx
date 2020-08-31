import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    const loadFoodAndExtras = async (): Promise<void> => {
      const { id } = routeParams;

      const response = await api.get<Food>(`/foods/${id}`);

      const selectedFood = response.data;

      setFood(selectedFood);

      const formattedExtras = selectedFood.extras.map((extra: Extra) => {
        return {
          ...extra,
          quantity: 0,
        };
      });

      setExtras(formattedExtras);
    };

    loadFoodAndExtras();
  }, [routeParams]);

  const changeExtraQuantity = useCallback(
    (id: number, quantity: number): void => {
      const index = extras.findIndex(extra => id === extra.id);
      const extra = extras[index];

      if (quantity >= 0) {
        extra.quantity += quantity;
      } else {
        extra.quantity = extra.quantity <= 0 ? 0 : extra.quantity - 1;
      }

      extras[index] = extra;
      setExtras([...extras]);
    },

    [extras],
  );

  const handleIncrementExtra = useCallback(
    (id: number): void => {
      changeExtraQuantity(id, +1);
    },

    [changeExtraQuantity],
  );

  const handleDecrementExtra = useCallback(
    (id: number): void => {
      changeExtraQuantity(id, -1);
    },
    [changeExtraQuantity],
  );

  const handleIncrementFood = useCallback((): void => {
    setFoodQuantity(foodQuantity + 1);
  }, [foodQuantity]);

  const handleDecrementFood = useCallback((): void => {
    if (foodQuantity > 1) setFoodQuantity(foodQuantity - 1);
  }, [foodQuantity]);

  const toggleFavorite = useCallback(async () => {
    try {
      if (isFavorite) {
        setIsFavorite(false);
        await api.delete(`/favorites/${food.id}`);
        return;
      }

      setIsFavorite(true);
      await api.post('/favorites', food);
    } catch (error) {
      console.error(error);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const extraSubTotal = extras.reduce((subTotal, extra) => {
      return subTotal + extra.value * extra.quantity;
    }, 0);
    const foodSubTotal = food.price * foodQuantity;

    return formatValue(extraSubTotal + foodSubTotal);
  }, [extras, food, foodQuantity]);

  const handleSubmitOrder = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get('/orders');

      const { data: orders } = response;

      const newOrder = {
        ...food,
        id: orders.length + 1,
        extras: { ...extras },
        quantity: foodQuantity,
      };
      delete newOrder.id;

      await api.post('/orders', newOrder);

      navigation.navigate('Orders');
    } catch (error) {
      console.error(error);
    }
  }, [extras, food, foodQuantity, navigation]);

  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>

        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>

        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleSubmitOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
