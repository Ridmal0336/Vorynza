package com.vorynza.wedding.cateringmenu.service;

import com.vorynza.wedding.cateringmenu.dto.CostEstimateRequest;
import com.vorynza.wedding.cateringmenu.dto.CostEstimateResponse;
import com.vorynza.wedding.cateringmenu.dto.MenuItemRequest;
import com.vorynza.wedding.cateringmenu.dto.MenuItemResponse;
import com.vorynza.wedding.cateringmenu.entity.CateringPackage;
import com.vorynza.wedding.cateringmenu.entity.MenuItem;
import com.vorynza.wedding.cateringmenu.repository.MenuItemRepository;
import com.vorynza.wedding.common.BusinessException;
import com.vorynza.wedding.common.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final CateringPackageService cateringPackageService;

    public MenuItemService(MenuItemRepository menuItemRepository, CateringPackageService cateringPackageService) {
        this.menuItemRepository = menuItemRepository;
        this.cateringPackageService = cateringPackageService;
    }

    @Transactional(readOnly = true)
    public List<MenuItemResponse> findAll(String category) {
        return menuItemRepository.findByCategory(category, true).stream()
                .map(MenuItemResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MenuItemResponse findById(Long id) {
        return MenuItemResponse.from(getEntity(id));
    }

    @Transactional(readOnly = true)
    public MenuItem getEntity(Long id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));
    }

    @Transactional
    public MenuItemResponse create(MenuItemRequest request) {
        MenuItem item = new MenuItem();
        apply(item, request);
        return MenuItemResponse.from(menuItemRepository.save(item));
    }

    @Transactional
    public MenuItemResponse update(Long id, MenuItemRequest request) {
        MenuItem item = getEntity(id);
        apply(item, request);
        return MenuItemResponse.from(menuItemRepository.save(item));
    }

    @Transactional
    public void delete(Long id) {
        MenuItem item = getEntity(id);
        item.setActive(false);
        menuItemRepository.save(item);
    }

    @Transactional(readOnly = true)
    public CostEstimateResponse estimateCost(CostEstimateRequest request) {
        if (request.cateringPackageId() == null
                && (request.menuItemIds() == null || request.menuItemIds().isEmpty())) {
            throw new BusinessException("Provide a catering package and/or menu item ids");
        }

        BigDecimal packageCost = BigDecimal.ZERO;
        BigDecimal menuItemsCost = BigDecimal.ZERO;
        List<String> lineItems = new ArrayList<>();
        int guests = request.guestCount();

        if (request.cateringPackageId() != null) {
            CateringPackage cateringPackage = cateringPackageService.getEntity(request.cateringPackageId());
            packageCost = cateringPackage.getPrice().multiply(BigDecimal.valueOf(guests));
            lineItems.add(cateringPackage.getName() + " x " + guests + " = " + packageCost);
        }

        if (request.menuItemIds() != null && !request.menuItemIds().isEmpty()) {
            List<MenuItem> items = menuItemRepository.findByIdInAndActiveTrue(request.menuItemIds());
            if (items.size() != request.menuItemIds().stream().distinct().count()) {
                throw new BusinessException("One or more menu items were not found or inactive");
            }
            for (MenuItem item : items) {
                BigDecimal line = item.getPrice().multiply(BigDecimal.valueOf(guests));
                menuItemsCost = menuItemsCost.add(line);
                lineItems.add(item.getName() + " x " + guests + " = " + line);
            }
        }

        BigDecimal total = packageCost.add(menuItemsCost);
        return new CostEstimateResponse(guests, packageCost, menuItemsCost, total, lineItems);
    }

    private void apply(MenuItem item, MenuItemRequest request) {
        item.setName(request.name());
        item.setCategory(request.category());
        item.setPrice(request.price());
        item.setDescription(request.description());
        item.setVegetarian(request.vegetarian() != null && request.vegetarian());
        item.setActive(request.active() == null || request.active());
        if (request.cateringPackageId() != null) {
            item.setCateringPackage(cateringPackageService.getEntity(request.cateringPackageId()));
        } else {
            item.setCateringPackage(null);
        }
    }
}
