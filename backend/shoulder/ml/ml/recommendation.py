import pickle
import jaxlib
import requests
import jax.numpy as jnp
from .dataset import Dataset
from .model import init_deep_fm
from .train import train, predict
import os, pathlib
from copy import deepcopy

WEIGHTS_PATH = os.path.join(pathlib.Path(__file__).parent, "weights/parameters.pkl")
PARAMETERS_PATH = os.path.join(pathlib.Path(__file__).parent, "weights/parameters.pkl")


def preprocess(raw_data: list, predict=False) -> jaxlib.xla_extension.ArrayImpl:
    """
    Prepare data for training or predicting

    Parameters:
    -----------
        raw_data (list[Dict]): a list of dictionaries from the event suggestions database
        predict (bool): whether including targets for training or only features to predict

    Returns:
        A tuple of preprocessed arrays for training or predicting
    """
    feature_list, target_list = [], []
    raw_copy = deepcopy(raw_data)

    for d in raw_copy:
        user_id = d["user_id"]
        del d["user_id"]
        del d["id"]
        if d.get("scenario_id"):
            del d["scenario_id"]
        if d.get("event_id"):
            del d["event_id"]

        if not predict:
            if d["attended_event"] == 1:
                target_list.append(1)
            else:
                target_list.append(0)
            del d["attended_event"]

        user_event_list, low, high = [], 0, 1

        for key in sorted(d.keys()):
            if d[key] is True:
                user_event_list.append(high)
            else:
                user_event_list.append(low)

            # Ensures unique integers for every response in very field, basically creating
            # a vocabulary for the embedding layer
            low += 2
            high += 2

        # Makes sure the user ID doesn't overlap with another "token"
        user_event_list.append(high + user_id)
        feature_list.append(user_event_list)

    x = jnp.array(feature_list, dtype=float)

    if not predict:
        y = jnp.array(target_list, dtype=float)
        return x, y
    else:
        return x


def pretrain(
    raw_data: requests.models.Response,
    num_factors: int = 5,
    batch_size=32,
    num_epochs: int = 10,
    seed=1994,
    seeds=(8, 6, 7),
    path: str = PARAMETERS_PATH,
) -> tuple[list]:
    """
    Pretrain a DeepFM

    Parameters:
    -----------
        raw_data (requests.models.Response): a response from the event suggestions table
        num_factors (int): the number of latent factors to consider for the FM
        batch_size (int): the number of training examples in each batch
        num_epochs (int): the number of passes to perform on the dataset durind training
        seed (int): a seed for shuffling the data
        seeds (tuple): a tuple of three seeds for model initialization
        path (str): a location to write thew eights to

    Returns:
    --------
        A tuple of lists of epochs, loss, and accuracy
    """
    full_x, full_y = preprocess(raw_data)
    data = Dataset(full_x, full_y, batch_size, seed)
    params = init_deep_fm(int(jnp.max(full_x)), full_x.shape[1], num_factors, seeds)
    epochs, loss_list, acc_list, params = train(params, data, num_epochs, path)

    return epochs, loss_list, acc_list


def finetune(
    raw_data: requests.models.Response,
    batch_size=32,
    num_epochs: int = 5,
    seed=1999,
    path: str = PARAMETERS_PATH,
) -> tuple[list]:
    """
    Finetune a DeepFM

    Parameters:
    -----------
        raw_data (requests.models.Response): a response from the event suggestions table.
        batch_size (int): the number of training examples in each batch.
        num_epochs (int): the number of passes to perform on the dataset durind training.
        seed (int): a seed for shuffling the data
        path (str): a location to write the updated weights to

    Returns:
    --------
        A tuple of lists of epochs, loss, and accuracy
    """
    full_x, full_y = preprocess(raw_data)
    data = Dataset(full_x, full_y, batch_size, seed)

    with open(WEIGHTS_PATH, "rb") as file:
        params = pickle.load(file)

    epochs, loss_list, acc_list, params = train(params, data, num_epochs, path=path)

    return epochs, loss_list, acc_list


def recommend(raw_data: requests.models.Response) -> jaxlib.xla_extension.ArrayImpl:
    """
    Get recommendations for users and events.

    Parameters:
    -----------
       raw_data (list): user and event data from the event suggestions table.

       Returns:
       --------
           A jax NumPy array of predicted probabilities of attending events
    """
    full_x = preprocess(raw_data, predict=True)
    return predict(full_x)
