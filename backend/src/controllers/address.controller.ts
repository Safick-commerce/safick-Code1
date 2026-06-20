// =============================================================================
// Address Controller — buyer delivery addresses
// =============================================================================
// Thin HTTP layer. Body has already been Zod-validated by the route middleware.
// =============================================================================

import type { NextFunction, Request, Response } from "express";
import * as addressService from "../services/address.service";
import { parseUuid } from "../utils/uuid";
import type { AddressInput, AddressUpdateInput } from "../types";

function requireUserId(req: Request, res: Response): string | null {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return req.userId;
}

function readAddressId(req: Request, res: Response): string | null {
  const id = parseUuid(String(req.params.id));
  if (!id) {
    res.status(400).json({ error: "Invalid address id" });
    return null;
  }
  return id;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const addresses = await addressService.listAddresses(userId);
    res.json({ addresses });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const address = await addressService.createAddress(userId, req.body as AddressInput);
    res.status(201).json({ address });
  } catch (error) {
    next(error);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = readAddressId(req, res);
    if (!id) return;
    const address = await addressService.getAddress(userId, id);
    res.json({ address });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = readAddressId(req, res);
    if (!id) return;
    const address = await addressService.updateAddress(
      userId,
      id,
      req.body as AddressUpdateInput,
    );
    res.json({ address });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = readAddressId(req, res);
    if (!id) return;
    await addressService.deleteAddress(userId, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
